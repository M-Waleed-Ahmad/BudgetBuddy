const express = require('express');
const categories = require('../controllers/categoryController');
const requireAuth = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);
router.route('/').get(categories.listCategories).post(categories.createCategory);
router.route('/:id').put(categories.updateCategory).delete(categories.deleteCategory);

module.exports = router;
