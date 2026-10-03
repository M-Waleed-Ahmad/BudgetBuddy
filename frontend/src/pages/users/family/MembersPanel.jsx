import { useMemo, useState } from 'react';
import { FiSearch, FiUserMinus, FiUserPlus } from 'react-icons/fi';
import avatarPlaceholder from '../../../assets/avatar.png';
import { ROLE_OPTIONS, idOf, roleLabel } from './permissions';
import { EmptyState, ErrorState, LoadingState } from './SectionStatus';

/** Plan members. Admins can invite, change roles and remove anyone except the owner. */
export default function MembersPanel({ members, permissions, currentUserId, onInvite, onChangeRole, onRemove, onRetry }) {
  const [search, setSearch] = useState('');
  const [savingId, setSavingId] = useState(null);

  const list = useMemo(() => members.data || [], [members.data]);
  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return list;
    return list.filter((member) =>
      [member.user?.name, member.user?.email].some((value) => value && value.toLowerCase().includes(query))
    );
  }, [list, search]);

  const handleRoleChange = async (member, role) => {
    setSavingId(member._id);
    try {
      await onChangeRole(member, role);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <section className="family-card" aria-labelledby="family-members-title">
      <header className="family-card__header">
        <h2 id="family-members-title" className="family-card__title">
          Members{members.data ? ` (${list.length})` : ''}
        </h2>
        {permissions.isAdmin && (
          <div className="family-card__actions">
            <button type="button" className="family-btn family-btn--primary" onClick={onInvite}>
              <FiUserPlus aria-hidden="true" /> Invite member
            </button>
          </div>
        )}
      </header>

      {list.length > 5 && (
        <div className="family-toolbar__search">
          <label htmlFor="member-search" className="family-visually-hidden">
            Search members
          </label>
          <FiSearch aria-hidden="true" />
          <input
            id="member-search"
            type="search"
            className="family-input"
            placeholder="Search by name or email"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      )}

      {members.error && <ErrorState message={members.error} onRetry={onRetry} retrying={members.loading} />}
      {members.loading && !members.data && <LoadingState label="Loading members…" />}
      {members.data && visible.length === 0 && (
        <EmptyState title={list.length === 0 ? 'No members yet' : 'No members match your search'} />
      )}

      {visible.length > 0 && (
        <ul className="family-members">
          {visible.map((member) => {
            const isMe = idOf(member.user) === String(currentUserId);
            const manageable = permissions.canManageMember(member);
            const name = member.user?.name || 'Unknown user';
            return (
              <li key={member._id} className="family-member">
                <img src={member.user?.avatar || avatarPlaceholder} alt="" className="family-member__avatar" />
                <div className="family-member__info">
                  <p className="family-member__name">
                    {name}
                    {isMe && <span className="family-muted"> (you)</span>}
                    {member.isOwner && <span className="family-badge family-badge--owner">Owner</span>}
                  </p>
                  <p className="family-muted family-member__email">{member.user?.email}</p>
                </div>
                <div className="family-member__controls">
                  {manageable ? (
                    <>
                      <label htmlFor={`member-role-${member._id}`} className="family-visually-hidden">
                        Role for {name}
                      </label>
                      <select
                        id={`member-role-${member._id}`}
                        className="family-input family-input--sm"
                        value={member.role}
                        onChange={(event) => handleRoleChange(member, event.target.value)}
                        disabled={savingId === member._id}
                      >
                        {ROLE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="family-icon-btn family-icon-btn--danger"
                        onClick={() => onRemove(member)}
                        disabled={savingId === member._id}
                        aria-label={`Remove ${name} from the plan`}
                        title="Remove member"
                      >
                        <FiUserMinus aria-hidden="true" />
                      </button>
                    </>
                  ) : (
                    <span className={`family-badge family-badge--${member.role}`}>{roleLabel(member.role)}</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
