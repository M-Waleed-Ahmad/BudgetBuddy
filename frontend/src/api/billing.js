import { BASE_URL, getAuthHeaders } from './client';

export const createCheckoutSession = async () => {
  const endpoint = `${BASE_URL}/billing/create-checkout-session`;
  const res = await fetch(endpoint, { method: 'POST', headers: getAuthHeaders() });
  const data = await res.json();
  if (!res.ok || data?.success === false) throw new Error(data.message || 'Failed to start checkout');
  return data.data;
};
