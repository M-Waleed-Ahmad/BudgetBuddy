import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiCheck, FiMail, FiX } from 'react-icons/fi';
import { acceptInvitation, getPendingInvitations, rejectInvitation } from '../../../api';
import { formatLocalDate } from '../../../utils/format';
import { roleLabel } from './permissions';
import { ErrorState } from './SectionStatus';

/** Invitations the current user has received. Renders nothing when there are none. */
export default function PendingInvitations({ onAccepted }) {
  const [invites, setInvites] = useState([]);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const list = await getPendingInvitations();
      setInvites(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err.message || 'Could not load your invitations.');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const respond = async (invite, accept) => {
    setBusyId(invite._id);
    try {
      if (accept) {
        const result = await acceptInvitation(invite._id);
        toast.success(`You joined "${invite.plan_name}".`);
        setInvites((prev) => prev.filter((item) => item._id !== invite._id));
        await onAccepted?.(result?.planId || invite.plan_id);
      } else {
        await rejectInvitation(invite._id);
        toast.success('Invitation declined.');
        setInvites((prev) => prev.filter((item) => item._id !== invite._id));
      }
    } catch (err) {
      toast.error(err.message || 'Could not respond to the invitation.');
    } finally {
      setBusyId(null);
    }
  };

  if (error) {
    return (
      <section className="family-card family-invites" aria-labelledby="family-invites-title">
        <h2 id="family-invites-title" className="family-card__title">
          Invitations
        </h2>
        <ErrorState message={error} onRetry={load} />
      </section>
    );
  }
  if (invites.length === 0) return null;

  return (
    <section className="family-card family-invites" aria-labelledby="family-invites-title">
      <h2 id="family-invites-title" className="family-card__title">
        <FiMail aria-hidden="true" /> Invitations ({invites.length})
      </h2>
      <ul className="family-invites__list">
        {invites.map((invite) => (
          <li key={invite._id} className="family-invites__item">
            <div>
              <p className="family-invites__plan">{invite.plan_name}</p>
              <p className="family-muted">
                {invite.inviter_name || 'Someone'} invited you as {roleLabel(invite.role_assigned)}
                {invite.expires_at && ` · expires ${formatLocalDate(invite.expires_at)}`}
              </p>
            </div>
            <div className="family-invites__actions">
              <button
                type="button"
                className="family-btn family-btn--secondary family-btn--sm"
                onClick={() => respond(invite, false)}
                disabled={busyId === invite._id}
              >
                <FiX aria-hidden="true" /> Decline
              </button>
              <button
                type="button"
                className="family-btn family-btn--primary family-btn--sm"
                onClick={() => respond(invite, true)}
                disabled={busyId === invite._id}
              >
                <FiCheck aria-hidden="true" /> Accept
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
