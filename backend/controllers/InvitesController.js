// controllers/inviteController.js
const Invite = require('../models/Invites');
const FamilyMember = require('../models/FamilyMember');
const FamilyPlan = require('../models/FamilyPlan'); // Needed for populate
const User = require('../models/User');             // Needed for populate
const mongoose = require('mongoose');

// @desc    Get pending invitations for the logged-in user
// @route   GET /api/invites/pending
// @access  Private
const getPendingInvites = async (req, res) => {
    try {
        const userId = req.user.userId; // From verifyToken middleware
        const invites = await Invite.find({ invitee_user_id: userId, status: 'pending' })
            .populate({ // Populate plan details
                path: 'plan_id',
                select: 'plan_name _id' // Select only needed fields
            })
            .populate({ // Populate inviter details
                path: 'inviter_user_id',
                select: 'name email _id' // Select only needed non-sensitive fields
            })
            .sort({ created_at: -1 }); // Show newest first
        // Format the response to be more frontend-friendly
        const formattedInvites = invites.map(invite => ({
            id: invite._id, // Use 'id' for frontend consistency
            plan_id: invite.plan_id?._id,
            plan_name: invite.plan_id?.plan_name || 'Unknown Plan',
            inviter_id: invite.inviter_user_id?._id,
            inviter_name: invite.inviter_user_id?.name || 'Unknown User',
            role_assigned: invite.role_assigned,
            status: invite.status,
            created_at: invite.created_at,
            // Calculate daysPending if needed, or send created_at
        }));
        console.log("Pending Invites:", formattedInvites); // Debugging line
        res.json(formattedInvites);

    } catch (error) {
        console.error("Error fetching pending invites:", error);
        res.status(500).json({ message: "Server error fetching invitations" });
    }
};

// @desc    Accept an invitation
// @route   POST /api/invites/:inviteId/accept
// @access  Private
const acceptInvite = async (req, res) => {
    try {
        const { inviteId } = req.params;
        const userId = req.user.userId; // Logged-in user

        if (!mongoose.Types.ObjectId.isValid(inviteId)) {
            return res.status(400).json({ message: 'Invalid invitation ID format' });
        }

        const invite = await Invite.findById(inviteId);

        // Validations
        if (!invite) {
            return res.status(404).json({ message: 'Invitation not found' });
        }
        if (invite.invitee_user_id.toString() !== userId) {
            return res.status(403).json({ message: 'You are not authorized to respond to this invitation' });
        }
        if (invite.status !== 'pending') {
            return res.status(400).json({ message: `Invitation is already ${invite.status}` });
        }
        // Optional: Check invite expiry if expires_at is set

        // Check if user is already a member of the plan
        const existingMembership = await FamilyMember.findOne({
            plan_id: invite.plan_id,
            user_id: userId
        });

        if (existingMembership) {
            // User is already a member, maybe just delete the invite?
            await invite.deleteOne();
            return res.status(400).json({ message: 'You are already a member of this plan' });
        }


        // --- Actions ---
        // 1. Create FamilyMember record
        const newMember = new FamilyMember({
            plan_id: invite.plan_id,
            user_id: userId,
            role: invite.role_assigned,
        });
        await newMember.save();


        // 2. Delete the invite (simpler than updating status)
        await invite.deleteOne();

        // 3. Respond successfully
        res.status(200).json({ message: 'Invitation accepted successfully', memberId: newMember._id });

    } catch (error) {
        console.error("Error accepting invite:", error);
        res.status(500).json({ message: "Server error accepting invitation" });
    }
};

// @desc    Reject an invitation
// @route   POST /api/invites/:inviteId/reject
// @access  Private
const rejectInvite = async (req, res) => {
     try {
        const { inviteId } = req.params;
        const userId = req.user.userId; // Logged-in user

         if (!mongoose.Types.ObjectId.isValid(inviteId)) {
            return res.status(400).json({ message: 'Invalid invitation ID format' });
        }

        const invite = await Invite.findById(inviteId);

        // Validations
        if (!invite) {
            return res.status(404).json({ message: 'Invitation not found' });
        }
        if (invite.invitee_user_id.toString() !== userId) {
            return res.status(403).json({ message: 'You are not authorized to respond to this invitation' });
        }
        if (invite.status !== 'pending') {
            return res.status(400).json({ message: `Invitation is already ${invite.status}` });
        }
        // Optional: Check invite expiry

        // --- Actions ---
        // Simply delete the invite record upon rejection
        await invite.deleteOne();

        // Respond successfully
        res.status(200).json({ message: 'Invitation rejected successfully' });

    } catch (error) {
        console.error("Error rejecting invite:", error);
        res.status(500).json({ message: "Server error rejecting invitation" });
    }
};


module.exports = {
    getPendingInvites,
    acceptInvite,
    rejectInvite
    // Add functions for creating/managing invites from the inviter's side later
};