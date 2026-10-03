import { http } from './client';

/** params: { start?, end?, category?, limit? } */
export const getExpenses = (params = {}) => http.get('/expenses', { query: params });

/** Resolves with { expenses, totalSpent, period: { start, end, source } }. */
export const fetchExpensesForCurrentMonth = () => http.get('/expenses/current-month-plan');

/** Resolves with { categoryWiseSpending: [{ categoryId, categoryName, totalSpent }] }. */
export const getCategoryWiseSpendingForCurrentMonth = () => http.get('/expenses/current-month/category-wise');

/** Resolves with { totalSpent }. */
export const getCurrentMonthSpendingTotal = () => http.get('/expenses/current-month-total');

/** Resolves with { months, categories: [{ name, data }] }. */
export const getSpendingTrends = (months = 6) => http.get('/expenses/trends', { query: { months } });

export const getRecentExpenses = (limit = 5) => http.get('/expenses/recent', { query: { limit } });

/** data: { category_id, amount, description?, notes?, expense_date } */
export const addExpense = (data) => http.post('/expenses', data);

export const updateExpense = (id, data) => http.put(`/expenses/${id}`, data);

export const deleteExpense = (id) => http.delete(`/expenses/${id}`);
