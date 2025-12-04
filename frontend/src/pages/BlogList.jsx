import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { listBlogs } from '../api/blogs';
import '../styles/dashboard.css';

const BlogList = () => {
  const [blogs, setBlogs] = useState([]);
  const [query, setQuery] = useState('');
  const [tag, setTag] = useState('');
  const [error, setError] = useState(null);

  const fetchBlogs = async () => {
    try {
      const res = await listBlogs({ q: query, tag });
      setBlogs(res.items || []);
    } catch (err) {
      setError(err.message || 'Failed to load blogs');
    }
  };

  useEffect(() => { fetchBlogs(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="page-container">
      <Navbar />
      <main className="dashboard-content">
        <div className="filters-row">
          <input className="form-control input" placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} />
          <input className="form-control input" placeholder="Tag" value={tag} onChange={(e) => setTag(e.target.value)} />
          <button className="link-button" onClick={fetchBlogs}>Search</button>
        </div>
        {error && <p className="error-message">{error}</p>}
        <div className="blog-grid">
          {blogs.map((blog) => (
            <Link key={blog._id} to={`/blog/${blog.slug}`} className="blog-card">
              <h3>{blog.title}</h3>
              <p>{blog.excerpt}</p>
              <div className="tags">{(blog.tags || []).map((t) => <span key={t} className="tag-pill">{t}</span>)}</div>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BlogList;
