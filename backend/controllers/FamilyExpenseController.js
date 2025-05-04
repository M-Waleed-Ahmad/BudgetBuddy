const FamilyExpense = require('../models/FamilyExpense');
const sendNotification = require('../utils/sendNotifications'); // Assuming you have a utility function to send notifications
const Plan = require('../models/FamilyPlan'); // Assuming you have a Plan model
const FamilyMember = require('../models/FamilyMember'); // Assuming you have a FamilyMember model
// Create a new family expense
const createExpense = async (req, res) => {
    try {
        const { plan_id, category_id, amount, description, notes, expense_date, status, approved_by_user_id } = req.body;
        const added_by_user_id = req.user.userId; // Assuming you have user info in req.user from middleware
        if (!plan_id || !category_id || !amount || !expense_date) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        console.log('Creating expense with data:', req.user.userId); // Debugging line
        console.log('User ID:', added_by_user_id); // Debugging line
        const newExpense = new FamilyExpense({
            plan_id,
            added_by_user_id,
            category_id,
            amount,
            description,
            notes,
            expense_date,
            status,
            approved_by_user_id,
        });

        const savedExpense = await newExpense.save();
        console.log('Saved expense:', savedExpense); // Debugging line
        // Send notification to the user who added the expense
        const plan = await Plan.findById(plan_id);
        if (!plan) {
            return res.status(404).json({ error: 'Plan not found' });
        }
        const planName = plan.plan_name; // Assuming the Plan model has a 'name' field
    // Fetch all family members for the plan
    const familyMembers = await FamilyMember.find({ plan_id });

    // Send notifications to all family members
    for (const member of familyMembers) {
        await sendNotification({
            recipient_user_id: member.user_id, // Assuming FamilyMember has a user_id field
            type: 'expense_added',
            message: `A new expense of $${savedExpense.amount} has been added to the plan "${planName}".`,
            actor_user_id: added_by_user_id,
            related_entity: {
                id: savedExpense._id,
                model_type: 'Expense',
            },
            link: `/expenses/${savedExpense._id}`,
        });
    }
        res.status(201).json(savedExpense);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Update an expense
const updateExpense = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const updatedExpense = await FamilyExpense.findByIdAndUpdate(id, updates, { new: true }).populate('added_by_user_id category_id approved_by_user_id');
        if (!updatedExpense) {
            return res.status(404).json({ error: 'Expense not found' });
        }

        // Send notification to the user who added the expense
        const plan = await Plan.findById(updatedExpense.plan_id);
        if (!plan) {
            return res.status(404).json({ error: 'Plan not found' });
        }
        const planName = plan.plan_name; // Assuming the Plan model has a 'name' field
        // Fetch all family members for the plan
        const familyMembers = await FamilyMember.find({ plan_id: updatedExpense.plan_id });

        // Send notifications to all family members
        for (const member of familyMembers) {
            await sendNotification({
            recipient_user_id: member.user_id, // Assuming FamilyMember has a user_id field
            type: 'generic_message',
            message: `The expense of $${updatedExpense.amount} has been updated in the plan "${planName}".`,
            actor_user_id: req.user.userId, // Assuming the user making the update is in req.user
            related_entity: {
                id: updatedExpense._id,
                model_type: 'Expense',
            },
            link: `/expenses/${updatedExpense._id}`,
            });
        }

        res.status(200).json(updatedExpense);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete an expense
const deleteExpense = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedExpense = await FamilyExpense.findByIdAndDelete(id);

        // Send notification to the user who deleted the expense
        const plan = await Plan.findById(deletedExpense.plan_id);
        if (!plan) {
            return res.status(404).json({ error: 'Plan not found' });
        }
        const planName = plan.plan_name; // Assuming the Plan model has a 'name' field
        // Fetch all family members for the plan
        const familyMembers = await FamilyMember.find({ plan_id: deletedExpense.plan_id });

        // Send notifications to all family members
        for (const member of familyMembers) {
            await sendNotification({
            recipient_user_id: member.user_id, // Assuming FamilyMember has a user_id field
            type: 'generic_message',
            message: `The expense of $${deletedExpense.amount} has been deleted from the plan "${planName}".`,
            actor_user_id: req.user.userId, // Assuming the user making the update is in req.user
            related_entity: {
                id: deletedExpense._id,
                model_type: 'Expense',
            },
            link: `/expenses/${deletedExpense._id}`,
            });
        }
        // Check if the expense was found and deleted
        if (!deletedExpense) {
            return res.status(404).json({ error: 'Expense not found' });
        }
        console.log('Deleted expense:', deletedExpense); // Debugging line
        res.status(200).json({ message: 'Expense deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};



const approveExpense = async (req, res) => {
    try {
        const { id } = req.params;
        const { approved_by_user_id } = req.user.userId; // Assuming you send the ID of the user approving the expense

        const updatedExpense = await FamilyExpense.findByIdAndUpdate(
            id,
            { status: 'approved', approved_by_user_id },
            { new: true }
        ).populate('added_by_user_id category_id approved_by_user_id');

        // Send notification to the user who approved the expense
        const plan = await Plan.findById(updatedExpense.plan_id);
        if (!plan) {
            return res.status(404).json({ error: 'Plan not found' });
        }
        const planName = plan.plan_name; // Assuming the Plan model has a 'name' field
        // Fetch all family members for the plan
        const familyMembers = await FamilyMember.find({ plan_id: updatedExpense.plan_id });

        // Send notifications to all family members
        for (const member of familyMembers) {
            await sendNotification({
            recipient_user_id: member.user_id, // Assuming FamilyMember has a user_id field
            type: 'generic_message',
            message: `The expense of $${updatedExpense.amount} has been approved in the plan "${planName}".`,
            actor_user_id: req.user.userId, // Assuming the user making the update is in req.user
            related_entity: {
                id: updatedExpense._id,
                model_type: 'Expense',
            },
            link: `/expenses/${updatedExpense._id}`,
            });
        }

        if (!updatedExpense) {
            return res.status(404).json({ error: 'Expense not found' });
        }

        res.status(200).json(updatedExpense);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

const rejectExpense = async (req, res) => {
    try {
        const { id } = req.params;
        const { approved_by_user_id } = req.user.userId; // Assuming you send the ID of the user rejecting the expense

        const updatedExpense = await FamilyExpense.findByIdAndUpdate(
            id,
            { status: 'rejected', approved_by_user_id },
            { new: true }
        ).populate('added_by_user_id category_id approved_by_user_id');

        // Send notification to the user who rejected the expense
        const plan = await Plan.findById(updatedExpense.plan_id);
        if (!plan) {
            return res.status(404).json({ error: 'Plan not found' });
        }
        const planName = plan.plan_name; // Assuming the Plan model has a 'name' field
        // Fetch all family members for the plan
        const familyMembers = await FamilyMember.find({ plan_id: updatedExpense.plan_id });
        
        // Send notifications to all family members
        for (const member of familyMembers) {
            await sendNotification({
            recipient_user_id: member.user_id, // Assuming FamilyMember has a user_id field
            type: 'generic_message',
            message: `The expense of $${updatedExpense.amount} has been rejected in the plan "${planName}".`,
            actor_user_id: req.user.userId, // Assuming the user making the update is in req.user
            related_entity: {
                id: updatedExpense._id,
                model_type: 'Expense',
            },
            link: `/expenses/${updatedExpense._id}`,
            });
        }


        if (!updatedExpense) {
            return res.status(404).json({ error: 'Expense not found' });
        }

        res.status(200).json(updatedExpense);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Get all expenses for a specific family plan
const getExpensesByPlan = async (req, res) => {
    try {
        const { plan_id } = req.params;

        const expenses = await FamilyExpense.find({ plan_id }).populate('added_by_user_id category_id approved_by_user_id');
        res.status(200).json(expenses);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Get a single expense by ID
const getExpenseById = async (req, res) => {
    try {
        const { id } = req.params;

        const expense = await FamilyExpense.findById(id).populate('added_by_user_id category_id approved_by_user_id');
        if (!expense) {
            return res.status(404).json({ error: 'Expense not found' });
        }

        res.status(200).json(expense);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
// Get all expenses for a specific plan and user
const getExpensesByPlanAndUser = async (req, res) => {
    try {
        const { plan_id, } = req.params;
        const user_id = req.user.userId; // Assuming you have user info in req.user from middleware
        if (!plan_id) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const expenses = await FamilyExpense.find({ plan_id, added_by_user_id: user_id }).populate('added_by_user_id category_id approved_by_user_id');
        res.status(200).json(expenses);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    createExpense,
    getExpensesByPlan,
    getExpenseById,
    updateExpense,
    deleteExpense,
    getExpensesByPlanAndUser,
    approveExpense,
    rejectExpense,
};