import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Navbar1 from '../components/Navbar1';
import Footer from '../components/Footer';
import { getBlog } from '../api/blogs';
import ShareButtons from '../features/pdf/ShareButtons';
import '../styles/blogDetail.css';

const BlogDetail = () => {
  const { slug } = useParams();
  const [blog, setBlog] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getBlog(slug);
        setBlog(data);
      } catch (err) {
        setError(err.message || 'Not found');
      }
    };
    load();
  }, [slug]);

  return (
    <div className="page-container">
      <Navbar1 />
      <main className="dashboard-content">
        {error && <p className="error-message">{error}</p>}
        {blog && (
          <article className="blog-article">
            <h1>{blog.title}</h1>
            <p className="muted-text">{blog.excerpt}</p>
            {blog.coverUrl && <img src={blog.coverUrl} alt={blog.title} className="blog-cover" />}
            <div className="blog-content">
              <pre style={{ whiteSpace: 'pre-wrap' }}>{blog.contentMD}</pre>
            </div>
            <div className="tags">{(blog.tags || []).map((t) => <span key={t} className="tag-pill">{t}</span>)}</div>
            <ShareButtons url={window.location.href} title={blog.title} />
          </article>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default BlogDetail;
