// controllers/familyMemberController.js
const mongoose = require('mongoose');
const FamilyPlan = require('../models/FamilyPlan');
const FamilyMember = require('../models/FamilyMember');
const User = require('../models/User');
const Invite = require('../models/Invites');

// --- Helper: Check User Role in Plan ---
// Returns the membership document if user is member, throws error otherwise
// Optionally checks for specific required roles
async function verifyMembershipAndRole(userId, planId, requiredRoles = ['admin', 'editor', 'viewer']) {
    if (!mongoose.Types.ObjectId.isValid(planId)) {
        throw { status: 400, message: 'Invalid Plan ID format.' };
    }
    const membership = await FamilyMember.findOne({ user_id: userId, plan_id: planId }).lean(); // Use lean if only reading role
    if (!membership) {
        throw { status: 403, message: 'User is not a member of this plan.' };
    }
    if (!requiredRoles.includes(membership.role)) {
        throw { status: 403, message: `User does not have required privileges (${requiredRoles.join('/')}).` };
    }
    return membership; // Return membership details (including role)
}

// --- Get Plan Members ---
// GET /api/family-plans/:planId/members
const getPlanMembers = async (req, res) => {
    try {
        const userId = req.user.userId;
        const planId = req.params.planId;

        // 1. Verify requester is a member of the plan
        await verifyMembershipAndRole(userId, planId); // Any role can view members

        // 2. Find members and populate user details
        const members = await FamilyMember.find({ plan_id: planId })
            .populate({
                path: 'user_id',
                select: 'name email profileImage' // Select desired user fields
            })
            .lean(); // Use lean for performance

        // 3. Format response (optional, but can be cleaner)
        const formattedMembers = members.map(mem => ({
            _id: mem._id, // FamilyMember document ID
            user: mem.user_id ? { // Handle potential null user if data is inconsistent
                _id: mem.user_id._id,
                name: mem.user_id.name,
                email: mem.user_id.email,
                avatar: mem.user_id.profileImage || null // Use placeholder on frontend if null
            } : null,
            role: mem.role,
            planId: mem.plan_id // Keep planId if needed
        }));

        res.status(200).json(formattedMembers);

    } catch (error) {
        console.error("Error fetching plan members:", error);
        if (error.status) {
            return res.status(error.status).json({ message: error.message });
        }
        res.status(500).json({ message: "Server error fetching members.", error: error.message });
    }
};

// --- Invite Member ---
// POST /api/family-plans/:planId/invites
const inviteMember = async (req, res) => {
    try {
        const inviterUserId = req.user.userId;
        const planId = req.params.planId;
        const { invitee_email, role_assigned } = req.body;

        if (!invitee_email || !role_assigned) {
            return res.status(400).json({ message: 'Invitee email and role are required.' });
        }
        if (!['viewer', 'editor'].includes(role_assigned)) { // Admins usually added differently or role updated later
             return res.status(400).json({ message: 'Invalid role assigned. Must be viewer or editor.' });
        }

        // 1. Verify inviter has permission (admin or editor)
        await verifyMembershipAndRole(inviterUserId, planId, ['admin', 'editor']);

        // 2. Find the user to invite by email
        const inviteeUser = await User.findOne({ email: invitee_email.toLowerCase() });
        if (!inviteeUser) {
            // Decide if you want to allow inviting non-registered users
            // If yes, modify Invite schema (remove required invitee_user_id or handle differently)
            // For now, assume user must be registered:
            return res.status(404).json({ message: `User with email ${invitee_email} not found. They must register first.` });
        }
        const inviteeUserId = inviteeUser._id;

        // 3. Check if invitee is already a member
        const existingMembership = await FamilyMember.findOne({ user_id: inviteeUserId, plan_id: planId });
        if (existingMembership) {
            return res.status(400).json({ message: 'User is already a member of this plan.' });
        }

        // 4. Check for existing pending invite for this user/plan
        const existingInvite = await Invite.findOne({
            plan_id: planId,
            invitee_user_id: inviteeUserId, // Use user ID since we found the user
            status: 'pending'
        });
        if (existingInvite) {
            // Optionally: Resend invite or update expiry? For now, just inform.
            return res.status(400).json({ message: 'An invitation is already pending for this user.' });
        }

        // 5. Create and save the invitation
        const newInvite = new Invite({
            plan_id: planId,
            invitee_user_id: inviteeUserId,
            inviter_user_id: inviterUserId,
            invitee_email: invitee_email.toLowerCase(), // Store email for reference
            role_assigned: role_assigned,
            status: 'pending',
            // expires_at: ... // Set expiry if desired
        });
        await newInvite.save();

        // TODO: Trigger notification (email or in-app) to the invitee

        res.status(201).json({ message: 'Invitation sent successfully.', invite: newInvite });

    } catch (error) {
        console.error("Error inviting member:", error);
        if (error.status) {
            return res.status(error.status).json({ message: error.message });
        }
        res.status(500).json({ message: "Server error sending invitation.", error: error.message });
    }
};

// --- Update Member Role ---
// PUT /api/family-plans/:planId/members/:memberUserId
const updateMemberRole = async (req, res) => {
    try {
        const requesterUserId = req.user.userId;
        const planId = req.params.planId;
        const memberUserId = req.params.memberUserId; // The ID of the user whose role is being changed
        const { role } = req.body;

        if (!role || !['viewer', 'editor', 'admin'].includes(role)) {
             return res.status(400).json({ message: 'Invalid or missing role.' });
        }
        if (!mongoose.Types.ObjectId.isValid(memberUserId)) {
             return res.status(400).json({ message: 'Invalid Member User ID format.' });
        }
        if (requesterUserId === memberUserId) {
            return res.status(400).json({ message: "Cannot change your own role via this method." });
        }

        // 1. Verify requester is admin
        await verifyMembershipAndRole(requesterUserId, planId, ['admin']);

        // 2. Find the target member's document
        const targetMembership = await FamilyMember.findOne({ plan_id: planId, user_id: memberUserId });
        if (!targetMembership) {
            return res.status(404).json({ message: 'Target member not found in this plan.' });
        }

        // 3. Prevent changing owner's role (optional but recommended)
        const plan = await FamilyPlan.findById(planId);
        if (plan && plan.owner_user_id.equals(memberUserId)) {
            return res.status(403).json({ message: "Cannot change the plan owner's role." });
        }

        // 4. Update the role
        targetMembership.role = role;
        await targetMembership.save();

        // TODO: Trigger notification to the member whose role changed

        res.status(200).json({ message: 'Member role updated successfully.', membership: targetMembership });

    } catch (error) {
        console.error("Error updating member role:", error);
        if (error.status) {
            return res.status(error.status).json({ message: error.message });
        }
         if (error.name === 'ValidationError') {
             return res.status(400).json({ message: 'Validation failed', errors: error.errors });
         }
        res.status(500).json({ message: "Server error updating role.", error: error.message });
    }
};

// --- Remove Member ---
// DELETE /api/family-plans/:planId/members/:memberUserId
const removeMember = async (req, res) => {
    try {
        const requesterUserId = req.user.userId;
        const planId = req.params.planId;
        const memberUserId = req.params.memberUserId;

        if (!mongoose.Types.ObjectId.isValid(memberUserId)) {
             return res.status(400).json({ message: 'Invalid Member User ID format.' });
        }
        if (requesterUserId === memberUserId) {
            return res.status(400).json({ message: "You cannot remove yourself from the plan." }); // Or implement a "Leave Plan" endpoint
        }

        // 1. Verify requester is admin
        await verifyMembershipAndRole(requesterUserId, planId, ['admin']);

        // 2. Check if target member is the owner (cannot remove owner)
         const plan = await FamilyPlan.findById(planId).lean();
         if (plan && plan.owner_user_id.equals(memberUserId)) {
             return res.status(403).json({ message: "Cannot remove the plan owner." });
         }

        // 3. Check if target member is the *last* admin (Safety Check)
        const adminMembers = await FamilyMember.find({ plan_id: planId, role: 'admin' }).lean();
        const targetMembership = await FamilyMember.findOne({ plan_id: planId, user_id: memberUserId }).lean();

        if (targetMembership && targetMembership.role === 'admin' && adminMembers.length <= 1) {
            return res.status(400).json({ message: 'Cannot remove the last admin of the plan.' });
        }

        // 4. Delete the membership document
        const deleteResult = await FamilyMember.findOneAndDelete({
            plan_id: planId,
            user_id: memberUserId
        });

        if (!deleteResult) {
            return res.status(404).json({ message: 'Member not found in this plan.' });
        }

        // TODO: Optionally remove associated pending invites for this user/plan?
        // TODO: Trigger notification to removed user?

        res.status(200).json({ message: 'Member removed successfully.' });

    } catch (error) {
        console.error("Error removing member:", error);
        if (error.status) {
            return res.status(error.status).json({ message: error.message });
        }
        res.status(500).json({ message: "Server error removing member.", error: error.message });
    }
};

module.exports = {
    getPlanMembers,
    inviteMember,
    updateMemberRole,
    removeMember
};