import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { listBlogs, createBlog, updateBlog, deleteBlog } from '../../api/blogs';
import '../../styles/dashboard.css';

const emptyForm = { title: '', excerpt: '', tags: '', coverUrl: '', contentMD: '', status: 'draft' };

const AdminBlogs = () => {
  const [blogs, setBlogs] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchBlogs = async () => {
    try {
      const res = await listBlogs({ page: 1, limit: 50 });
      setBlogs(res.items || []);
    } catch (err) {
      setError(err.message || 'Failed to load blogs');
    }
  };

  useEffect(() => { fetchBlogs(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const payload = { ...form, tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean) };
      if (editingId) {
        await updateBlog(editingId, payload);
      } else {
        await createBlog(payload);
      }
      setForm(emptyForm);
      setEditingId(null);
      await fetchBlogs();
    } catch (err) {
      setError(err.message || 'Failed to save blog');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (blog) => {
    setEditingId(blog._id);
    setForm({
      title: blog.title,
      excerpt: blog.excerpt || '',
      tags: (blog.tags || []).join(', '),
      coverUrl: blog.coverUrl || '',
      contentMD: blog.contentMD || '',
      status: blog.status || 'draft',
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this blog?')) return;
    await deleteBlog(id);
    fetchBlogs();
  };

  return (
    <div className="page-container">
      <Navbar />
      <main className="dashboard-content">
        <h1>Admin Blogs</h1>
        {error && <p className="error-message">{error}</p>}
        <div className="dashboard-grid">
          <div className="recent-expenses-column">
            <h3>{editingId ? 'Edit Blog' : 'New Blog'}</h3>
            <form className="blog-form" onSubmit={handleSubmit}>
              <input name="title" placeholder="Title" value={form.title} onChange={handleChange} required />
              <input name="excerpt" placeholder="Excerpt" value={form.excerpt} onChange={handleChange} />
              <input name="tags" placeholder="Tags (comma-separated)" value={form.tags} onChange={handleChange} />
              <input name="coverUrl" placeholder="Cover URL" value={form.coverUrl} onChange={handleChange} />
              <select name="status" value={form.status} onChange={handleChange}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
              <textarea name="contentMD" rows="10" placeholder="Markdown content" value={form.contentMD} onChange={handleChange} />
              <button className="link-button" type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
              {editingId && <button className="link-button" type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }}>Reset</button>}
            </form>
          </div>
          <div className="line-chart-column">
            <h3>Preview</h3>
            <div className="blog-preview">
              <ReactMarkdown>{form.contentMD || '_Write some markdown..._'}</ReactMarkdown>
            </div>
          </div>
        </div>

        <section className="budget-section-dash">
          <h3>Existing Blogs</h3>
          <table className="cashflow-table">
            <thead><tr><th>Title</th><th>Status</th><th>Tags</th><th>Actions</th></tr></thead>
            <tbody>
              {blogs.map((b) => (
                <tr key={b._id}>
                  <td>{b.title}</td>
                  <td>{b.status}</td>
                  <td>{(b.tags || []).join(', ')}</td>
                  <td>
                    <button className="link-button" onClick={() => startEdit(b)}>Edit</button>
                    <button className="link-button" onClick={() => handleDelete(b._id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default AdminBlogs;
