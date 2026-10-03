import { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '../../../components/Modal';
import { inviteMember } from '../../../api';
import { ROLE_OPTIONS } from './permissions';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Admin-only: invites an existing BudgetBuddy user to the plan. */
export default function InviteMemberModal({ isOpen, onClose, planId, planName, onSent }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('editor');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const inviteeEmail = email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(inviteeEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await inviteMember(planId, { invitee_email: inviteeEmail, role_assigned: role });
      toast.success(`Invitation sent to ${inviteeEmail}.`);
      onSent?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Could not send the invitation.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedRole = ROLE_OPTIONS.find((option) => option.value === role);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invite a member">
      <form className="family-form" onSubmit={handleSubmit} noValidate>
        <p className="family-form-hint">
          Invite someone to <strong>{planName}</strong>. They need a BudgetBuddy account and have 7 days to accept.
        </p>
        {error && (
          <p className="family-form-error" role="alert">
            {error}
          </p>
        )}
        <div className="family-field">
          <label htmlFor="invite-email">Email address</label>
          <input
            id="invite-email"
            type="email"
            className="family-input"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@example.com"
            autoComplete="email"
            required
            disabled={submitting}
            autoFocus
          />
        </div>
        <div className="family-field">
          <label htmlFor="invite-role">Role</label>
          <select
            id="invite-role"
            className="family-input"
            value={role}
            onChange={(event) => setRole(event.target.value)}
            disabled={submitting}
            aria-describedby="invite-role-help"
          >
            {ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p id="invite-role-help" className="family-field-help">
            {selectedRole?.description}
          </p>
        </div>
        <div className="family-form-actions">
          <button type="button" className="family-btn family-btn--secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="family-btn family-btn--primary" disabled={submitting}>
            {submitting ? 'Sending…' : 'Send invitation'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
