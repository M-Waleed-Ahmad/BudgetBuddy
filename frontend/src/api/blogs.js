import { BASE_URL, getAuthHeaders } from './client';

export const listBlogs = async ({ q, tag, page = 1, limit = 10 } = {}) => {
  const params = new URLSearchParams();
  if (q) params.append('q', q);
  if (tag) params.append('tag', tag);
  params.append('page', page);
  params.append('limit', limit);
  const res = await fetch(`${BASE_URL}/blogs?${params.toString()}`);
  const data = await res.json();
  if (!res.ok || data?.success === false) throw new Error(data.message || 'Failed to fetch blogs');
  return data.data;
};

export const listMyBlogs = async ({ page = 1, limit = 20 } = {}) => {
  const params = new URLSearchParams();
  params.append('page', page);
  params.append('limit', limit);
  const res = await fetch(`${BASE_URL}/blogs/mine?${params.toString()}`, { headers: getAuthHeaders() });
  const data = await res.json();
  if (!res.ok || data?.success === false) throw new Error(data.message || 'Failed to fetch my blogs');
  return data.data;
};

export const getBlog = async (slug) => {
  const res = await fetch(`${BASE_URL}/blogs/${slug}`);
  const data = await res.json();
  if (!res.ok || data?.success === false) throw new Error(data.message || 'Blog not found');
  return data.data;
};

export const createBlog = async (payload) => {
  const res = await fetch(`${BASE_URL}/blogs`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(payload) });
  const data = await res.json();
  if (!res.ok || data?.success === false) throw new Error(data.message || 'Failed to create blog');
  return data.data;
};

export const updateBlog = async (id, payload) => {
  const res = await fetch(`${BASE_URL}/blogs/${id}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(payload) });
  const data = await res.json();
  if (!res.ok || data?.success === false) throw new Error(data.message || 'Failed to update blog');
  return data.data;
};

export const deleteBlog = async (id) => {
  const res = await fetch(`${BASE_URL}/blogs/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
  const data = await res.json();
  if (!res.ok || data?.success === false) throw new Error(data.message || 'Failed to delete blog');
  return data.data;
};
