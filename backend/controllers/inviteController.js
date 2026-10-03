const FamilyMember = require('../models/FamilyMember');
const FamilyPlan = require('../models/FamilyPlan');
const Invite = require('../models/Invite');
const User = require('../models/User');
const v = require('../utils/validation');
const { badRequest, notFound } = require('../utils/httpError');
const { notify, notifyMany } = require('../utils/notify');

const planLink = (planId) => `/shared-budgeting?plan=${planId}`;

/** Loads a pending invite addressed to the current user, expiring it if it is past its date. */
async function findOwnPendingInvite(req) {
  const inviteId = v.assertObjectId(req.params.inviteId, 'invitation id');
  const invite = await Invite.findOne({ _id: inviteId, invitee_user_id: req.user.userId });
  if (!invite) throw notFound('Invitation not found.');
  if (invite.status !== 'pending') throw badRequest(`This invitation was already ${invite.status}.`);
  if (invite.isExpired()) {
    invite.status = 'expired';
    await invite.save();
    throw badRequest('This invitation has expired. Ask the plan admin to send a new one.');
  }

  const plan = await FamilyPlan.findById(invite.plan_id);
  if (!plan) {
    await invite.deleteOne();
    throw notFound('This plan no longer exists.');
  }
  return { invite, plan };
}

async function respond(invite, status) {
  invite.status = status;
  invite.responded_at = new Date();
  await invite.save();
}

// GET /api/invites/pending
async function listPendingInvites(req, res) {
  const invites = await Invite.find({
    invitee_user_id: req.user.userId,
    status: 'pending',
    expires_at: { $gt: new Date() },
  })
    .populate('plan_id', 'plan_name')
    .populate('inviter_user_id', 'name')
    .sort({ created_at: -1 })
    .lean();

  res.json(
    invites
      .filter((invite) => invite.plan_id)
      .map((invite) => ({
        _id: invite._id,
        plan_id: invite.plan_id._id,
        plan_name: invite.plan_id.plan_name,
        inviter_name: invite.inviter_user_id?.name || 'A BudgetBuddy user',
        role_assigned: invite.role_assigned,
        created_at: invite.created_at,
        expires_at: invite.expires_at,
      }))
  );
}

// POST /api/invites/:inviteId/accept
async function acceptInvite(req, res) {
  const { invite, plan } = await findOwnPendingInvite(req);

  const alreadyMember = await FamilyMember.exists({ plan_id: plan._id, user_id: req.user.userId });
  if (!alreadyMember) {
    await FamilyMember.create({ plan_id: plan._id, user_id: req.user.userId, role: invite.role_assigned });
  }
  await respond(invite, 'accepted');

  const user = await User.findById(req.user.userId).select('name').lean();
  const name = user?.name || 'Someone';
  await notify({
    recipient: invite.inviter_user_id,
    type: 'invite_accepted',
    message: `${name} accepted your invitation to "${plan.plan_name}".`,
    actor: req.user.userId,
    related: { id: plan._id, model_type: 'FamilyPlan' },
    link: planLink(plan._id),
  });
  const admins = await FamilyMember.find({ plan_id: plan._id, role: 'admin' }).select('user_id').lean();
  await notifyMany(
    admins.map((admin) => admin.user_id).filter((id) => String(id) !== String(invite.inviter_user_id)),
    {
      type: 'member_joined_plan',
      message: `${name} joined "${plan.plan_name}" as ${invite.role_assigned}.`,
      actor: req.user.userId,
      related: { id: plan._id, model_type: 'FamilyPlan' },
      link: planLink(plan._id),
    }
  );

  res.json({ message: `You joined "${plan.plan_name}".`, planId: plan._id });
}

// POST /api/invites/:inviteId/reject
async function rejectInvite(req, res) {
  const { invite, plan } = await findOwnPendingInvite(req);
  await respond(invite, 'rejected');

  const user = await User.findById(req.user.userId).select('name').lean();
  await notify({
    recipient: invite.inviter_user_id,
    type: 'invite_rejected',
    message: `${user?.name || 'Someone'} declined your invitation to "${plan.plan_name}".`,
    actor: req.user.userId,
    related: { id: plan._id, model_type: 'FamilyPlan' },
    link: planLink(plan._id),
  });

  res.json({ message: 'Invitation declined.' });
}

module.exports = { listPendingInvites, acceptInvite, rejectInvite };
