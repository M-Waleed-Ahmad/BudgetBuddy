// controllers/familyPlanController.js
const mongoose = require('mongoose');
const FamilyPlan = require('../models/FamilyPlan');
const FamilyMember = require('../models/FamilyMember');
const FamilyBudget = require('../models/FamilyBudget'); // Needed for delete cleanup
const FamilyExpense = require('../models/FamilyExpense'); // Needed for delete cleanup
const Invite = require('../models/Invites'); // Needed for delete cleanup

// --- Helper Function for Role Check ---
// (You might move this to a dedicated authorization middleware later)
async function checkPlanAdmin(userId, planId) {
    const membership = await FamilyMember.findOne({ user_id: userId, plan_id: planId });
    if (!membership) {
        throw { status: 404, message: 'User is not a member of this plan.' };
    }
    if (membership.role !== 'admin') {
        throw { status: 403, message: 'User does not have admin privileges for this plan.' };
    }
    return membership; // Return membership if needed elsewhere
}


// --- Fetch All Plans for Logged-in User ---
const   getUserPlans = async (req, res) => {
    try {
        const userId = req.user.userId; // Assumes auth middleware adds userId to req.user
        if (!userId) {
            return res.status(401).json({ message: 'Authentication required.' });
        }

        // Find all memberships for the user and populate the plan details
        const memberships = await FamilyMember.find({ user_id: userId })
            .populate({
                path: 'plan_id',
                select: 'plan_name owner_user_id currency created_at' // Select fields you need in the list
            })
            .lean(); // Use lean for performance if not modifying docs

        // Format the response
        const userPlans = memberships
            .filter(mem => mem.plan_id) // Filter out memberships where plan might have been deleted inconsistently
            .map(mem => ({
                planId: mem.plan_id._id, // Use planId for consistency with frontend potentially
                _id: mem.plan_id._id,    // Include _id as well
                name: mem.plan_id.plan_name,
                userRole: mem.role,
                // Add other plan details if needed in the list view
            }));

        res.status(200).json(userPlans);

    } catch (error) {
        console.error("Error fetching user plans:", error);
        res.status(500).json({ message: "Server error fetching plans.", error: error.message });
    }
};

// --- Create a New Family Plan ---
const   createPlan = async (req, res) => {
    try {
        const userId = req.user.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Authentication required.' });
        }

        const { plan_name, total_budget_amount, start_date, end_date, currency } = req.body;

        if (!plan_name) {
            return res.status(400).json({ message: 'Plan name is required.' });
        }

        // Create the new plan
        const newPlan = new FamilyPlan({
            plan_name,
            owner_user_id: userId,
            total_budget_amount: total_budget_amount || null, // Handle optional fields
            start_date: start_date || null,
            end_date: end_date || null,
            currency: currency || req.user.currency_preference || 'USD', // Default or from user preference
        });
        const savedPlan = await newPlan.save();

        // Automatically add the creator as an admin member
        const ownerMembership = new FamilyMember({
            plan_id: savedPlan._id,
            user_id: userId,
            role: 'admin',
        });
        await ownerMembership.save();

        // Return the newly created plan (consider populating owner details if needed)
        res.status(201).json(savedPlan);

    } catch (error) {
        console.error("Error creating plan:", error);
        if (error.name === 'ValidationError') {
             return res.status(400).json({ message: 'Validation failed', errors: error.errors });
        }
        res.status(500).json({ message: "Server error creating plan.", error: error.message });
    }
};

// --- Update Plan Settings ---
const   updatePlan = async (req, res) => {
    try {
        const userId = req.user.userId;
        const planId = req.params.planId; // Get planId from URL parameter
        const { plan_name, total_budget_amount, start_date, end_date, currency } = req.body;

        if (!userId) {
            return res.status(401).json({ message: 'Authentication required.' });
        }
        if (!mongoose.Types.ObjectId.isValid(planId)) {
             return res.status(400).json({ message: 'Invalid Plan ID format.' });
        }

        // 1. Check if user is admin for this plan
        await checkPlanAdmin(userId, planId); // Throws error if not admin or member

        // 2. Prepare update data (only include fields that were actually sent)
        const updateData = {};
        if (plan_name !== undefined) updateData.plan_name = plan_name;
        if (total_budget_amount !== undefined) updateData.total_budget_amount = total_budget_amount;
        if (start_date !== undefined) updateData.start_date = start_date;
        if (end_date !== undefined) updateData.end_date = end_date;
        if (currency !== undefined) updateData.currency = currency;

        if (Object.keys(updateData).length === 0) {
             return res.status(400).json({ message: 'No update fields provided.' });
        }
        // Add validation for dates if needed: if (updateData.start_date && updateData.end_date && new Date(updateData.start_date) >= new Date(updateData.end_date)) { ... }

        // 3. Find and update the plan
        const updatedPlan = await FamilyPlan.findByIdAndUpdate(
            planId,
            { $set: updateData },
            { new: true, runValidators: true } // Return updated doc, run schema validations
        );

        if (!updatedPlan) {
            return res.status(404).json({ message: 'Plan not found.' });
        }

        res.status(200).json(updatedPlan);

    } catch (error) {
        console.error("Error updating plan:", error);
         if (error.status) { // Handle errors thrown by checkPlanAdmin
             return res.status(error.status).json({ message: error.message });
         }
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Validation failed', errors: error.errors });
        }
        res.status(500).json({ message: "Server error updating plan.", error: error.message });
    }
};

// --- Delete a Family Plan ---
const deletePlan = async (req, res) => {
    const session = await mongoose.startSession(); // Start a session for transaction
    session.startTransaction();
    try {
        const userId = req.user.userId;
        const planId = req.params.planId;

        if (!userId) {
             await session.abortTransaction();
             session.endSession();
            return res.status(401).json({ message: 'Authentication required.' });
        }
         if (!mongoose.Types.ObjectId.isValid(planId)) {
             await session.abortTransaction();
             session.endSession();
             return res.status(400).json({ message: 'Invalid Plan ID format.' });
        }

        // 1. Check if user is admin
        await checkPlanAdmin(userId, planId); // This already checks membership & role

        // Optional: Prevent deletion if user is the *only* admin? Might be complex. Assume allowed for now.

        console.log(`Attempting to delete plan ${planId} and associated data...`);

        // 2. Delete associated data within the transaction
        const deleteExpensesResult = await FamilyExpense.deleteMany({ plan_id: planId }, { session });
        console.log(`Deleted ${deleteExpensesResult.deletedCount} family expenses.`);

        const deleteBudgetsResult = await FamilyBudget.deleteMany({ plan_id: planId }, { session });
        console.log(`Deleted ${deleteBudgetsResult.deletedCount} family budgets (limits).`);

        const deleteInvitesResult = await Invite.deleteMany({ plan_id: planId }, { session });
        console.log(`Deleted ${deleteInvitesResult.deletedCount} invites.`);

        const deleteMembersResult = await FamilyMember.deleteMany({ plan_id: planId }, { session });
        console.log(`Deleted ${deleteMembersResult.deletedCount} family members.`);

        // 3. Delete the plan itself
        const deletedPlan = await FamilyPlan.findByIdAndDelete(planId, { session });

        if (!deletedPlan) {
            // Should not happen if checkPlanAdmin passed, but good failsafe
            throw new Error('Plan not found during delete operation.');
        }
        console.log(`Deleted plan ${planId} itself.`);

        // 4. If all deletes succeeded, commit the transaction
        await session.commitTransaction();
        session.endSession();

        res.status(200).json({ message: `Plan '${deletedPlan.plan_name}' and all associated data deleted successfully.` });

    } catch (error) {
        // If any error occurs, abort the transaction
        await session.abortTransaction();
        session.endSession();
        console.error("Error deleting plan:", error);
         if (error.status) { // Handle errors thrown by checkPlanAdmin
             return res.status(error.status).json({ message: error.message });
         }
        res.status(500).json({ message: "Server error deleting plan.", error: error.message });
    }
};

// --- Fetch Details of a Specific Plan --- (if needed, not in original routes)
const getPlanDetails = async (req, res) => {
    try {
        const userId = req.user.userId;
        const planId = req.params.planId;

        if (!userId) {
            return res.status(401).json({ message: 'Authentication required.' });
        }
         if (!mongoose.Types.ObjectId.isValid(planId)) {
             return res.status(400).json({ message: 'Invalid Plan ID format.' });
        }

        // 1. Check if user is a member of the plan
        const membership = await FamilyMember.findOne({ user_id: userId, plan_id: planId });
        if (!membership) {
            return res.status(404).json({ message: 'User is not a member of this plan.' });
        }

        // 2. Fetch the plan details
        const planDetails = await FamilyPlan.findById(planId)
            .populate('owner_user_id', 'username email') // Populate owner details if needed
            .lean(); // Use lean for performance

        if (!planDetails) {
            return res.status(404).json({ message: 'Plan not found.' });
        }

        res.status(200).json(planDetails);

    } catch (error) {
        console.error("Error fetching plan details:", error);
         if (error.status) { // Handle errors thrown by checkPlanAdmin
             return res.status(error.status).json({ message: error.message });
         }
        res.status(500).json({ message: "Server error fetching plan details.", error: error.message });
    }
};
module.exports = {
    getUserPlans,
    createPlan,
    updatePlan,
    deletePlan,
    getPlanDetails,
};