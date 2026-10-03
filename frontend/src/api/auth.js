import { http } from './client';

export const loginUser = ({ email, password }) =>
  http.post('/auth/login', { email, password }, { auth: false });

export const signupUser = ({ name, email, password, recovery_email, currency_preference }) =>
  http.post('/auth/signup', { name, email, password, recovery_email, currency_preference }, { auth: false });

export const logoutUser = () => http.post('/auth/logout');

export const forgotPassword = (email) => http.post('/auth/forgot-password', { email }, { auth: false });

export const resetPassword = (token, password) =>
  http.post('/auth/reset-password', { token, password }, { auth: false });
