const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true, index: true },
  excerpt: { type: String, default: '' },
  contentMD: { type: String, default: '' },
  tags: [{ type: String }],
  coverUrl: { type: String, default: '' },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

blogSchema.pre('save', function(next) { this.updatedAt = new Date(); next(); });
blogSchema.pre('findOneAndUpdate', function(next) { this.set({ updatedAt: new Date() }); next(); });

module.exports = mongoose.model('Blog', blogSchema);
