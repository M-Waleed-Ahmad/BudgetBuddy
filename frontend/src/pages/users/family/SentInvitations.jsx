import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiX } from 'react-icons/fi';
import { cancelPlanInvite, getPlanInvites } from '../../../api';
import { formatLocalDate } from '../../../utils/format';
import { roleLabel } from './permissions';
import { ErrorState } from './SectionStatus';

/** Admin-only list of pending invitations sent for the plan, with the option to cancel them. */
export default function SentInvitations({ planId }) {
  const [invites, setInvites] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setInvites(await getPlanInvites(planId));
    } catch (err) {
      setError(err.message || 'Could not load sent invitations.');
    } finally {
      setLoading(false);
    }
  }, [planId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCancel = async (invite) => {
    setCancellingId(invite._id);
    try {
      await cancelPlanInvite(planId, invite._id);
      setInvites((prev) => prev.filter((item) => item._id !== invite._id));
      toast.success(`Invitation for ${invite.invitee_email} cancelled.`);
    } catch (err) {
      toast.error(err.message || 'Could not cancel the invitation.');
    } finally {
      setCancellingId(null);
    }
  };

  if (error) {
    return (
      <section className="family-card" aria-label="Sent invitations">
        <ErrorState message={error} onRetry={load} retrying={loading} />
      </section>
    );
  }
  if (!invites || invites.length === 0) return null;

  return (
    <section className="family-card" aria-labelledby="family-sent-invites-title">
      <header className="family-card__header">
        <h2 id="family-sent-invites-title" className="family-card__title">
          Pending invitations ({invites.length})
        </h2>
      </header>
      <ul className="family-members">
        {invites.map((invite) => (
          <li key={invite._id} className="family-member">
            <div className="family-member__info">
              <p className="family-member__name">{invite.invitee_name || invite.invitee_email}</p>
              <p className="family-muted family-member__email">
                {invite.invitee_email} · {roleLabel(invite.role_assigned)} · expires {formatLocalDate(invite.expires_at)}
              </p>
            </div>
            <div className="family-member__controls">
              <button
                type="button"
                className="family-icon-btn family-icon-btn--danger"
                onClick={() => handleCancel(invite)}
                disabled={cancellingId === invite._id}
                aria-label={`Cancel invitation for ${invite.invitee_email}`}
                title="Cancel invitation"
              >
                <FiX aria-hidden="true" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
