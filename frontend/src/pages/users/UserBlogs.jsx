import React, { useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import ReactMarkdown from 'react-markdown';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { listBlogs, listMyBlogs, createBlog, updateBlog, deleteBlog } from '../../api/blogs';
import '../../styles/userblog.css';

const emptyForm = { title: '', excerpt: '', tags: '', coverUrl: '', contentMD: '', status: 'draft' };

const UserBlogs = () => {
  const { user } = useSelector((state) => state.auth);
  const [publishedBlogs, setPublishedBlogs] = useState([]);
  const [myBlogs, setMyBlogs] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [tag, setTag] = useState('');

  const isOwner = (blog) => user && blog?.authorId?.toString?.() === user.userId;

  const fetchPublished = async () => {
    try {
      const res = await listBlogs({ q: search, tag, limit: 50 });
      setPublishedBlogs(res.items || []);
    } catch (err) {
      setError(err.message || 'Failed to load blogs');
    }
  };

  const fetchMine = async () => {
    try {
      const res = await listMyBlogs({ page: 1, limit: 50 });
      setMyBlogs(res.items || []);
    } catch (err) {
      setError(err.message || 'Failed to load my blogs');
    }
  };

  useEffect(() => {
    fetchPublished();
    fetchMine();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = { ...form, tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean) };
      if (editingId) {
        await updateBlog(editingId, payload);
      } else {
        await createBlog(payload);
      }
      setForm(emptyForm);
      setEditingId(null);
      await Promise.all([fetchPublished(), fetchMine()]);
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
    try {
      await deleteBlog(id);
      await Promise.all([fetchPublished(), fetchMine()]);
    } catch (err) {
      setError(err.message || 'Failed to delete blog');
    }
  };

  const filteredPublished = useMemo(() => publishedBlogs, [publishedBlogs]);

  return (
    <div className="page-container">
      <Navbar />
      <main className="dashboard-content">
        <header className="page-header">
          <div>
            <h1>Blogs</h1>
            <p className="muted-text">Write your own posts and read everyone’s published articles.</p>
            {user && <p className="muted-text">Signed in as {user.name || user.email}</p>}
          </div>
          <div className="filters-row">
            <input
              className="form-control input"
              placeholder="Search title or tag"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <input
              className="form-control input"
              placeholder="Tag"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
            />
            <button className="link-button" onClick={fetchPublished}>Search</button>
          </div>
        </header>

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
              <textarea name="contentMD" rows="8" placeholder="Markdown content" value={form.contentMD} onChange={handleChange} />
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
          <h3>My Blogs</h3>
          {!myBlogs.length && <p className="muted-text">You have not created any blogs yet.</p>}
          <table className="cashflow-table">
            <thead><tr><th>Title</th><th>Status</th><th>Tags</th><th>Actions</th></tr></thead>
            <tbody>
              {myBlogs.map((b) => (
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

        <section className="budget-section-dash">
          <h3>All Published Blogs</h3>
          <div className="blog-grid">
            {filteredPublished.map((blog) => (
              <article key={blog._id} className="blog-card">
                <h4>{blog.title}</h4>
                <p>{blog.excerpt}</p>
                <div className="tags">{(blog.tags || []).map((t) => <span key={t} className="tag-pill">{t}</span>)}</div>
                <div className="blog-actions-inline">
                  <a className="link-button" href={`/blog/${blog.slug}`}>Read</a>
                  {isOwner(blog) && (
                    <>
                      <button className="link-button" onClick={() => startEdit(blog)}>Edit</button>
                      <button className="link-button" onClick={() => handleDelete(blog._id)}>Delete</button>
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default UserBlogs;
