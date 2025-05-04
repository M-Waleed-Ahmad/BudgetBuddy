const Budget = require('../models/Budget');
const User = require('../models/User'); // Assuming you have a User model
const Expense = require('../models/Expense'); // Assuming you have an Expense model
const Category = require('../models/Category'); // Assuming you have a Category model
const sendNotification = require('../utils/sendNotifications'); // Assuming you have a utility function for sending notifications
// Get all budgets
const getAllBudgets = async (req, res) => {
    try {
        const budgets = await Budget.find();
        res.status(200).json(budgets);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Get a single budget by ID
const getBudgetById = async (req, res) => {
    try {
        const budget = await Budget.findById(req.params.id);
        if (!budget) {
            return res.status(404).json({ message: 'Budget not found' });
        }
        res.status(200).json(budget);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

const createBudget = async (req, res) => {
    try {
      const newBudget = new Budget(req.body);
      const userId = req.user.userId;
  
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }
  
      newBudget.user_id = userId;
      const savedBudget = await newBudget.save();
      const category = await Category.findById(savedBudget.category_id);
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
        }
        
        const categoryName = category.name;
      // ✅ Send a notification to the user about their new budget
      await sendNotification({
        recipient_user_id: userId,
        type: 'generic_message', // Or create a new enum value 'budget_created' if you like
        message: `You created a new budget. "${categoryName}"`,
        actor_user_id: userId,
        related_entity: {
          id: savedBudget._id,
          model_type: 'Budget',
        },
        link: `/budgets/${savedBudget._id}`
      });
  
      res.status(201).json(savedBudget);
    } catch (error) {
      res.status(400).json({ message: 'Error creating budget', error });
    }
  };
  

// Update a budget by ID
const updateBudget = async (req, res) => {
    try {
      const updatedBudget = await Budget.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );
  
      if (!updatedBudget) {
        return res.status(404).json({ message: 'Budget not found' });
      }
      const category = await Category.findById(updatedBudget.category_id);
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
        }
        
        const categoryName = category.name;

      // ✅ Send a notification to the user about the update
      await sendNotification({
        recipient_user_id: req.user.userId,
        type: 'generic_message', // Or 'budget_updated' if you add it to your enum later
        message: `Your budget for"${categoryName}" was updated.`,
        actor_user_id: req.user.userId,
        related_entity: {
          id: updatedBudget._id,
          model_type: 'Budget',
        },
        link: `/budgets/${updatedBudget._id}`
      });
  
      res.status(200).json(updatedBudget);
    } catch (error) {
      res.status(400).json({ message: 'Error updating budget', error });
    }
  };
  

// Delete a budget by ID
const deleteBudget = async (req, res) => {
    try {
        const budget = await Budget.findById(req.params.id);

        if (!budget) {
            return res.status(404).json({ message: 'Budget not found' });
        }

        console.log('Budget to be deleted:', budget);
        categoryId = budget.category_id;
        console.log('Category ID associated with this budget:', categoryId);
        expense = await Expense.findById(categoryId);
        console.log('Expense associated with this budget:', expense);
        const category = await Category.findById(categoryId);
        if (!category) {
          return res.status(404).json({ message: 'Category not found' });
          }
          
          const categoryName = category.name;
        
        if (expense && expense.length > 0) {
            return res.status(400).json({ message: 'Cannot delete budget with associated expenses in the same category' });
        }

        const deletedBudget = await Budget.findByIdAndDelete(req.params.id);
        

        // ✅ Send a notification to the user about the deletion
        await sendNotification({
            recipient_user_id: req.user.userId,
            type: 'generic_message', 
            message: `Your budget "${categoryName}" was deleted.`,
            actor_user_id: req.user.userId,
            related_entity: {
                id: deletedBudget._id,
                model_type: 'Budget',
            },
            link: `/budgets`
        });

        res.status(200).json({ message: 'Budget deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
// Get all budgets for the logged-in user for a specific month
const getUserBudgetsForMonth = async (req, res) => {
    try {

        const userId = req.user.userId; // Or req.user._id, depending on your JWT setup
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        // Get monthYear from query parameters (e.g., /api/budgets?monthYear=2024-08)
        const { monthYear } = req.query;
        if (!monthYear || !/^\d{4}-\d{2}$/.test(monthYear)) {
             // Send empty array or error if monthYear is missing/invalid? Let's send empty for now.
             console.warn('MonthYear query parameter missing or invalid:', monthYear);
            return res.status(200).json([]);
            // Alternatively: return res.status(400).json({ message: 'Valid monthYear query parameter (YYYY-MM) is required' });
        }


         const budgets = await Budget.find({
            user_id: userId,
            month_year: monthYear
        }).populate('category_id', 'name'); // Populate category name
        let returnedBudgets = [];
        returnedBudgets = budgets.map(budget => {
            return {
                ...budget._doc,
                category_name: budget.category_id.name // Add category name to the returned object
            };
        });
       
        console.log('Fetched budgets for month:', monthYear, 'Budgets:', returnedBudgets);
        res.status(200).json(returnedBudgets || []); // Return found budgets or empty array

    } catch (error) {
        console.error('Error fetching user budgets for month:', error);
        res.status(500).json({ message: 'Server error while fetching budgets', error: error.message });
    }
};



module.exports = { 
    getAllBudgets,
    getBudgetById,
    createBudget,
    updateBudget,
    deleteBudget,
    getUserBudgetsForMonth,
};