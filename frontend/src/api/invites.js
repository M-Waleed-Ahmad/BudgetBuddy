import { http } from './client';

export const getPendingInvitations = () => http.get('/invites/pending');

export const acceptInvitation = (inviteId) => http.post(`/invites/${inviteId}/accept`);

export const rejectInvitation = (inviteId) => http.post(`/invites/${inviteId}/reject`);
