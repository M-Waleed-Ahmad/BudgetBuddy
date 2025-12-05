const Blog = require('../models/Blog');
const slugify = require('slugify');

// GET /api/blogs?q&tag&page&limit
const listBlogs = async (req, res) => {
  try {
    const { q = '', tag, page = 1, limit = 10 } = req.query;
    const match = { status: 'published' };
    if (q) match.$or = [{ title: { $regex: q, $options: 'i' } }, { tags: { $regex: q, $options: 'i' } }];
    if (tag) match.tags = tag;
    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      Blog.find(match).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).select('-contentMD'),
      Blog.countDocuments(match),
    ]);
    return res.status(200).json({ success: true, data: { items, total }, message: 'Blogs fetched' });
  } catch (err) {
    console.error('Error listing blogs', err);
    return res.status(500).json({ success: false, data: null, message: 'Server error listing blogs' });
  }
};

// GET /api/blogs/mine (auth)
const listMyBlogs = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, data: null, message: 'Auth required' });
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      Blog.find({ authorId: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Blog.countDocuments({ authorId: userId }),
    ]);
    return res.status(200).json({ success: true, data: { items, total }, message: 'My blogs fetched' });
  } catch (err) {
    console.error('Error listing my blogs', err);
    return res.status(500).json({ success: false, data: null, message: 'Server error listing my blogs' });
  }
};

// GET /api/blogs/:slug
const getBlog = async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug, status: 'published' });
    if (!blog) return res.status(404).json({ success: false, data: null, message: 'Blog not found' });
    return res.status(200).json({ success: true, data: blog, message: 'Blog fetched' });
  } catch (err) {
    console.error('Error fetching blog', err);
    return res.status(500).json({ success: false, data: null, message: 'Server error fetching blog' });
  }
};

// POST /api/blogs (admin)
const createBlog = async (req, res) => {
  try {
    const { title, excerpt, contentMD, tags = [], coverUrl, status = 'draft' } = req.body;
    const slug = slugify(title || '', { lower: true, strict: true });
    const exists = await Blog.findOne({ slug });
    if (exists) return res.status(400).json({ success: false, data: null, message: 'Slug already exists' });
    const blog = await Blog.create({
      title,
      slug,
      excerpt,
      contentMD,
      tags,
      coverUrl,
      status,
      authorId: req.user?.userId,
    });
    return res.status(201).json({ success: true, data: blog, message: 'Blog created' });
  } catch (err) {
    console.error('Error creating blog', err);
    return res.status(500).json({ success: false, data: null, message: 'Server error creating blog' });
  }
};

// PUT /api/blogs/:id (admin)
const updateBlog = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, data: null, message: 'Auth required' });

    const { title, excerpt, contentMD, tags, coverUrl, status } = req.body;
    const updates = { title, excerpt, contentMD, tags, coverUrl, status };
    if (title) updates.slug = slugify(title, { lower: true, strict: true });
    const blog = await Blog.findOneAndUpdate(
      { _id: req.params.id, authorId: userId },
      updates,
      { new: true }
    );
    if (!blog) return res.status(404).json({ success: false, data: null, message: 'Blog not found or not owned by user' });
    return res.status(200).json({ success: true, data: blog, message: 'Blog updated' });
  } catch (err) {
    console.error('Error updating blog', err);
    return res.status(500).json({ success: false, data: null, message: 'Server error updating blog' });
  }
};

// DELETE /api/blogs/:id (admin)
const deleteBlog = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, data: null, message: 'Auth required' });
    const blog = await Blog.findOneAndDelete({ _id: req.params.id, authorId: userId });
    if (!blog) return res.status(404).json({ success: false, data: null, message: 'Blog not found or not owned by user' });
    return res.status(200).json({ success: true, data: null, message: 'Blog deleted' });
  } catch (err) {
    console.error('Error deleting blog', err);
    return res.status(500).json({ success: false, data: null, message: 'Server error deleting blog' });
  }
};

module.exports = { listBlogs, listMyBlogs, getBlog, createBlog, updateBlog, deleteBlog };
