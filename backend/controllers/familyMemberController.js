const FamilyMember = require('../models/FamilyMember');
const Invite = require('../models/Invite');
const User = require('../models/User');
const v = require('../utils/validation');
const { badRequest, conflict, forbidden, notFound } = require('../utils/httpError');
const { notify, notifyMany } = require('../utils/notify');
const { isPlanOwner } = require('../middleware/planAccess');

const ROLES = ['admin', 'editor', 'viewer'];
const ROLE_ORDER = { admin: 0, editor: 1, viewer: 2 };

const planLink = (plan) => `/shared-budgeting?plan=${plan._id}`;

async function displayName(userId) {
  const user = await User.findById(userId).select('name').lean();
  return user?.name || 'Someone';
}

function parseRole(value, field = 'role') {
  if (!ROLES.includes(value)) throw badRequest(`${field} must be one of ${ROLES.join(', ')}.`, { [field]: 'Invalid role' });
  return value;
}

// GET /api/family-plans/:planId/members
async function listMembers(req, res) {
  const { plan } = req;
  const members = await FamilyMember.find({ plan_id: plan._id }).populate('user_id', 'name email profileImage').lean();

  const formatted = members
    .map((member) => ({
      _id: member._id,
      role: member.role,
      isOwner: isPlanOwner(plan, member.user_id?._id),
      joined_at: member.joined_at,
      user: member.user_id
        ? {
            _id: member.user_id._id,
            name: member.user_id.name,
            email: member.user_id.email,
            avatar: member.user_id.profileImage || null,
          }
        : null,
    }))
    .sort(
      (a, b) =>
        Number(b.isOwner) - Number(a.isOwner) ||
        ROLE_ORDER[a.role] - ROLE_ORDER[b.role] ||
        (a.user?.name || '').localeCompare(b.user?.name || '')
    );
  res.json(formatted);
}

// PUT /api/family-plans/:planId/members/:userId (admin)
async function updateMemberRole(req, res) {
  const { plan } = req;
  const targetUserId = v.assertObjectId(req.params.userId, 'user id');
  const role = parseRole(req.body.role);

  if (targetUserId === req.user.userId) throw badRequest("You can't change your own role.");
  if (isPlanOwner(plan, targetUserId)) throw forbidden("The plan owner's role can't be changed.");

  const member = await FamilyMember.findOne({ plan_id: plan._id, user_id: targetUserId });
  if (!member) throw notFound('That person is not a member of this plan.');

  if (member.role !== role) {
    member.role = role;
    await member.save();
    await notify({
      recipient: targetUserId,
      type: 'role_changed',
      message: `Your role in "${plan.plan_name}" is now ${role}.`,
      actor: req.user.userId,
      related: { id: plan._id, model_type: 'FamilyPlan' },
      link: planLink(plan),
    });
  }

  res.json({ message: 'Role updated.', member: { _id: member._id, role: member.role, user_id: member.user_id } });
}

// DELETE /api/family-plans/:planId/members/:userId (admin, or the member themselves to leave)
async function removeMember(req, res) {
  const { plan, membership } = req;
  const targetUserId = v.assertObjectId(req.params.userId, 'user id');
  const leaving = targetUserId === req.user.userId;

  if (leaving) {
    if (isPlanOwner(plan, targetUserId)) {
      throw badRequest("The plan owner can't leave the plan. Delete the plan instead.");
    }
    await membership.deleteOne();

    const admins = await FamilyMember.find({ plan_id: plan._id, role: 'admin' }).select('user_id').lean();
    await notifyMany(
      admins.map((admin) => admin.user_id),
      {
        type: 'generic_message',
        message: `${await displayName(targetUserId)} left "${plan.plan_name}".`,
        actor: targetUserId,
        related: { id: plan._id, model_type: 'FamilyPlan' },
        link: planLink(plan),
      }
    );
    return res.json({ message: `You left "${plan.plan_name}".` });
  }

  if (membership.role !== 'admin') throw forbidden('Only admins can remove members.');
  if (isPlanOwner(plan, targetUserId)) throw forbidden("The plan owner can't be removed.");

  const removed = await FamilyMember.findOneAndDelete({ plan_id: plan._id, user_id: targetUserId });
  if (!removed) throw notFound('That person is not a member of this plan.');

  await notify({
    recipient: targetUserId,
    type: 'member_removed',
    message: `You were removed from the family plan "${plan.plan_name}".`,
    actor: req.user.userId,
    link: '/shared-budgeting',
  });
  res.json({ message: 'Member removed.' });
}

// POST /api/family-plans/:planId/invites (admin)
async function inviteMember(req, res) {
  const { plan } = req;
  const email = v.email(req.body.invitee_email, 'invitee_email');
  const role = parseRole(req.body.role_assigned, 'role_assigned');

  const invitee = await User.findOne({ email }).select('_id name').lean();
  if (!invitee) throw notFound('No BudgetBuddy account uses that email. Ask them to sign up first.');
  if (String(invitee._id) === req.user.userId) throw badRequest("You can't invite yourself.");
  if (await FamilyMember.exists({ plan_id: plan._id, user_id: invitee._id })) {
    throw conflict(`${invitee.name} is already a member of this plan.`);
  }

  const pending = await Invite.findOne({ plan_id: plan._id, invitee_email: email, status: 'pending' });
  if (pending && !pending.isExpired()) throw conflict(`${invitee.name} already has a pending invitation to this plan.`);
  if (pending) {
    pending.status = 'expired';
    await pending.save();
  }

  const invite = await Invite.create({
    plan_id: plan._id,
    invitee_user_id: invitee._id,
    inviter_user_id: req.user.userId,
    invitee_email: email,
    role_assigned: role,
  });

  await notify({
    recipient: invitee._id,
    type: 'invite_received',
    message: `${await displayName(req.user.userId)} invited you to join "${plan.plan_name}" as ${role === 'admin' ? 'an' : 'a'} ${role}.`,
    actor: req.user.userId,
    related: { id: invite._id, model_type: 'Invite' },
    link: '/settings',
  });

  res.status(201).json({
    message: `Invitation sent to ${invitee.name}.`,
    invite: {
      _id: invite._id,
      invitee_email: invite.invitee_email,
      role_assigned: invite.role_assigned,
      expires_at: invite.expires_at,
    },
  });
}

// GET /api/family-plans/:planId/invites (admin) — pending invitations sent for this plan
async function listPlanInvites(req, res) {
  const invites = await Invite.find({ plan_id: req.plan._id, status: 'pending', expires_at: { $gt: new Date() } })
    .populate('invitee_user_id', 'name')
    .populate('inviter_user_id', 'name')
    .sort({ created_at: -1 })
    .lean();

  res.json(
    invites.map((invite) => ({
      _id: invite._id,
      invitee_email: invite.invitee_email,
      invitee_name: invite.invitee_user_id?.name || null,
      inviter_name: invite.inviter_user_id?.name || null,
      role_assigned: invite.role_assigned,
      created_at: invite.created_at,
      expires_at: invite.expires_at,
    }))
  );
}

// DELETE /api/family-plans/:planId/invites/:inviteId (admin) — cancel a pending invitation
async function cancelPlanInvite(req, res) {
  const inviteId = v.assertObjectId(req.params.inviteId, 'invitation id');
  const invite = await Invite.findOneAndDelete({ _id: inviteId, plan_id: req.plan._id, status: 'pending' });
  if (!invite) throw notFound('Pending invitation not found.');
  res.json({ message: 'Invitation cancelled.' });
}

module.exports = { listMembers, updateMemberRole, removeMember, inviteMember, listPlanInvites, cancelPlanInvite };
