import { http } from './client';

export const getCategories = () => http.get('/categories');

export const addCategory = (name) => http.post('/categories', { name });

export const updateCategory = (id, name) => http.put(`/categories/${id}`, { name });

export const deleteCategory = (id) => http.delete(`/categories/${id}`);
