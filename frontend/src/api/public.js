import { http } from './client';

export const sendContactMessage = ({ name, email, message }) =>
  http.post('/contact-us', { name, email, message }, { auth: false });

export const subscribeToNewsletter = (email) => http.post('/newsletter', { email }, { auth: false });
