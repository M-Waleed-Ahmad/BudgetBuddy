import { http } from './client';

// --- Monthly budgets (overall target for a period) ---

export const getMonthlyBudgets = () => http.get('/monthly-budgets');

/** Resolves with the current MonthlyBudget, or null when none is set. */
export const getCurrentMonthBudget = () => http.get('/monthly-budgets/current');

/** data: { total_budget_amount, start_date, end_date } */
export const createMonthlyBudget = (data) => http.post('/monthly-budgets', data);

export const updateMonthlyBudget = (id, data) => http.put(`/monthly-budgets/${id}`, data);

export const deleteMonthlyBudget = (id) => http.delete(`/monthly-budgets/${id}`);

// --- Category budgets (per-category limit for a month) ---

export const getBudgetsForMonth = (monthYear) => http.get('/budgets', { query: { monthYear } });

/** data: { category_id, limit_amount, month_year, description? } */
export const addBudgetItem = (data) => http.post('/budgets', data);

export const updateBudgetItem = (id, data) => http.put(`/budgets/${id}`, data);

export const deleteBudgetItem = (id) => http.delete(`/budgets/${id}`);
