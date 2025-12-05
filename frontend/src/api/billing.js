import { BASE_URL, getAuthHeaders } from './client';

export const createCheckoutSession = async (plan = 'family') => {
  const endpoint = `${BASE_URL}/billing/create-checkout-session`;
  const res = await fetch(endpoint, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ plan }) });
  const data = await res.json();
  if (!res.ok || data?.success === false) throw new Error(data.message || 'Failed to start checkout');
  return data.data;
};

export const confirmCheckoutSession = async (sessionId) => {
  const endpoint = `${BASE_URL}/billing/confirm`;
  const res = await fetch(endpoint, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ sessionId }) });
  const data = await res.json();
  if (!res.ok || data?.success === false) throw new Error(data.message || 'Failed to confirm checkout');
  return data.data;
};
