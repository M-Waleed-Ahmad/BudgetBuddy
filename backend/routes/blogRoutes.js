const express = require('express');
const { listBlogs, getBlog, createBlog, updateBlog, deleteBlog } = require('../controllers/blogController');
const verifyToken = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', listBlogs);
router.get('/:slug', getBlog);
router.post('/', verifyToken, createBlog);
router.put('/:id', verifyToken, updateBlog);
router.delete('/:id', verifyToken, deleteBlog);

module.exports = router;
