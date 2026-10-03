import { http } from './client';

// --- Plans ---

export const getUserFamilyPlans = () => http.get('/family-plans');

/** data: { plan_name, total_budget_amount?, start_date?, end_date?, currency?, require_approval? } */
export const createFamilyPlan = (data) => http.post('/family-plans', data);

export const getPlanDetails = (planId) => http.get(`/family-plans/${planId}`);

/** data: any subset of the create fields plus categoryBudgets: [{ category_id, limit_amount }] */
export const updatePlanSettings = (planId, data) => http.put(`/family-plans/${planId}`, data);

export const deleteFamilyPlan = (planId) => http.delete(`/family-plans/${planId}`);

/** Resolves with the plan owner's categories: [{ _id, name, limitAmount }]. */
export const getPlanCategories = (planId) => http.get(`/family-plans/${planId}/categories`);

// --- Members & invites ---

export const getPlanMembers = (planId) => http.get(`/family-plans/${planId}/members`);

/** role_assigned: 'viewer' | 'editor' | 'admin' */
export const inviteMember = (planId, { invitee_email, role_assigned }) =>
  http.post(`/family-plans/${planId}/invites`, { invitee_email, role_assigned });

/** Pending invitations sent for this plan (admins only). */
export const getPlanInvites = (planId) => http.get(`/family-plans/${planId}/invites`);

export const cancelPlanInvite = (planId, inviteId) => http.delete(`/family-plans/${planId}/invites/${inviteId}`);

export const updateMemberRole = (planId, userId, role) =>
  http.put(`/family-plans/${planId}/members/${userId}`, { role });

/** Removes a member (admin) or leaves the plan when userId is the current user. */
export const removeMember = (planId, userId) => http.delete(`/family-plans/${planId}/members/${userId}`);

// --- Expenses ---

export const getPlanExpenses = (planId, { mine = false } = {}) =>
  http.get(`/family-plans/${planId}/expenses`, { query: mine ? { mine: 'true' } : undefined });

/** data: { category_id, amount, description, notes?, expense_date } */
export const createFamilyExpense = (planId, data) => http.post(`/family-plans/${planId}/expenses`, data);

export const updateFamilyExpense = (planId, expenseId, data) =>
  http.put(`/family-plans/${planId}/expenses/${expenseId}`, data);

export const deleteFamilyExpense = (planId, expenseId) =>
  http.delete(`/family-plans/${planId}/expenses/${expenseId}`);

export const approveFamilyExpense = (planId, expenseId) =>
  http.post(`/family-plans/${planId}/expenses/${expenseId}/approve`);

export const rejectFamilyExpense = (planId, expenseId) =>
  http.post(`/family-plans/${planId}/expenses/${expenseId}/reject`);
