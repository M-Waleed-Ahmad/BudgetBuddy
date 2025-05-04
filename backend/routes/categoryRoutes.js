// routes/categoryRoutes.js
const express = require('express');
const router = express.Router();
const {
    getUserCategories,
    createCategory,
    updateCategory,
    deleteCategory
} = require('../controllers/categoryController');
const verifyToken = require('../middleware/authMiddleware'); // Your auth middleware

// Apply verifyToken middleware to all category routes
router.use(verifyToken);

// Define CRUD routes
router.route('/')
    .get(getUserCategories)    // GET /api/categories
    .post(createCategory);   // POST /api/categories

router.route('/:id')
    .put(updateCategory)     // PUT /api/categories/:id
    .delete(deleteCategory); // DELETE /api/categories/:id

module.exports = router;