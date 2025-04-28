// controllers/categoryController.js
const Category = require('../models/Category');
const mongoose = require('mongoose'); // Needed for ObjectId validation

// @desc    Get all categories for the logged-in user
// @route   GET /api/categories
// @access  Private
const getUserCategories = async (req, res) => {
    try {
        const categories = await Category.find({ user_id: req.user.userId });
        res.json(categories);
    } catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).json({ message: "Server error fetching categories" });
    }
};

// @desc    Create a new category for the logged-in user
// @route   POST /api/categories
// @access  Private
const createCategory = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return res.status(400).json({ message: 'Category name is required and cannot be empty' });
        }

        // Optional: Check if category name already exists for this user
        const existingCategory = await Category.findOne({ user_id: req.user.userId, name: name.trim() });
        if (existingCategory) {
            return res.status(400).json({ message: `Category '${name.trim()}' already exists` });
        }

        const newCategory = new Category({
            name: name.trim(),
            user_id: req.user.userId, // Associate with the logged-in user
        });

        const savedCategory = await newCategory.save();
        res.status(201).json(savedCategory); // Return the newly created category

    } catch (error) {
        console.error("Error creating category:", error);
        res.status(500).json({ message: "Server error creating category" });
    }
};

// @desc    Update a category for the logged-in user
// @route   PUT /api/categories/:id
// @access  Private
const updateCategory = async (req, res) => {
    try {
        const { name } = req.body;
        const categoryId = req.params.id;

        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return res.status(400).json({ message: 'Category name is required and cannot be empty' });
        }
        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
             return res.status(400).json({ message: 'Invalid category ID format' });
        }

        const category = await Category.findById(categoryId);

        // Check if category exists and belongs to the user
        if (!category || category.user_id.toString() !== req.user.userId) {
            return res.status(404).json({ message: 'Category not found or not authorized' });
        }

        // Optional: Check if the *new* name already exists for this user (excluding the current category being updated)
        const existingCategory = await Category.findOne({
             user_id: req.user.userId,
             name: name.trim(),
             _id: { $ne: categoryId } // Check for other categories with the same name
        });
        if (existingCategory) {
            return res.status(400).json({ message: `Category '${name.trim()}' already exists` });
        }

        category.name = name.trim();
        const updatedCategory = await category.save();

        res.json(updatedCategory);

    } catch (error) {
        console.error("Error updating category:", error);
        res.status(500).json({ message: "Server error updating category" });
    }
};

// @desc    Delete a category for the logged-in user
// @route   DELETE /api/categories/:id
// @access  Private
const deleteCategory = async (req, res) => {
    try {
        const categoryId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
             return res.status(400).json({ message: 'Invalid category ID format' });
        }

        const category = await Category.findById(categoryId);

        // Check if category exists and belongs to the user
        if (!category || category.user_id.toString() !== req.user.userId) {
            return res.status(404).json({ message: 'Category not found or not authorized' });
        }

        // TODO: Consider implications - What happens to expenses using this category?
        // Option 1: Delete the category (simplest, might orphan expenses)
        // Option 2: Prevent deletion if expenses exist
        // Option 3: Reassign expenses to a default category (e.g., "Uncategorized")
        // Option 4: Ask user for confirmation / how to handle expenses (complex UI)

        // Let's go with Option 1 for now (simple deletion)
        await category.deleteOne(); // Use deleteOne() or remove() based on Mongoose version

        res.json({ message: `Category ${categoryId} deleted successfully` });

    } catch (error) {
        console.error("Error deleting category:", error);
        res.status(500).json({ message: "Server error deleting category" });
    }
};


module.exports = {
    getUserCategories,
    createCategory,
    updateCategory,
    deleteCategory
};