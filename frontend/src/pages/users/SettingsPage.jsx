import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FiCheck, FiLogOut, FiUpload, FiX } from 'react-icons/fi';
import AppLayout from '../../components/AppLayout';
import Avatar from '../../components/Avatar';
import ConfirmDialog from '../../components/ConfirmDialog';
import SectionState from '../../components/SectionState';
import { useAuth } from '../../context/AuthContext';
import { useAsyncData } from '../../hooks/useAsyncData';
import {
  acceptInvitation,
  getPendingInvitations,
  getUserProfile,
  isImageUploadConfigured,
  rejectInvitation,
  updateUserProfile,
  uploadProfileImage,
} from '../../api';
import { CURRENCIES, formatLocalDate, formatRelativeTime } from '../../utils/format';
import '../../styles/SettingsPage.css';

const MIN_PASSWORD_LENGTH = 8;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const loadInvitations = async () => (await getPendingInvitations()) || [];

/** Keeps the cached auth user in sync with a Profile returned by the API. */
function toSessionUser(profile) {
  const { _id, name, email, currency_preference: currencyPreference, profileImage } = profile;
  return { _id, name, email, currency_preference: currencyPreference, profileImage };
}

// ---------------------------------------------------------------------------
// Profile details (name, recovery email, picture)
// ---------------------------------------------------------------------------
const ProfileSection = ({ profile, onSaved }) => {
  const [form, setForm] = useState({ name: profile.name || '', recovery_email: profile.recovery_email || '' });
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl('');
      return undefined;
    }
    const url = URL.createObjectURL(imageFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file.');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error('Please choose an image smaller than 5 MB.');
      return;
    }
    setImageFile(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const name = form.name.trim();
    const recoveryEmail = form.recovery_email.trim();
    if (!name) return setError('Please enter your name.');
    if (recoveryEmail && recoveryEmail.toLowerCase() === (profile.email || '').toLowerCase()) {
      return setError('Your recovery email must be different from your login email.');
    }

    setIsSaving(true);
    setError('');
    try {
      const updates = { name, recovery_email: recoveryEmail };
      if (imageFile) updates.profileImage = await uploadProfileImage(imageFile);
      const saved = await updateUserProfile(updates);
      setImageFile(null);
      onSaved(saved);
      toast.success('Profile updated.');
    } catch (err) {
      setError(err.message || 'Could not update your profile.');
      toast.error(err.message || 'Could not update your profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section id="profile" className="card settings-page__section" aria-labelledby="settings-profile-title">
      <h2 id="settings-profile-title" className="card-title">
        Profile
      </h2>
      <form onSubmit={handleSubmit} noValidate>
        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}
        <div className="settings-page__picture">
          <Avatar src={previewUrl || profile.profileImage} name={form.name || profile.name} size={88} />
          <div className="settings-page__picture-controls">
            <span className="form-label" id="profile-picture-label">
              Profile picture
            </span>
            {isImageUploadConfigured ? (
              <>
                <input
                  ref={fileInputRef}
                  id="profile-image-input"
                  type="file"
                  accept="image/*"
                  className="visually-hidden"
                  onChange={handleImageChange}
                  disabled={isSaving}
                  aria-labelledby="profile-picture-label"
                />
                <div className="settings-page__picture-buttons">
                  <button
                    type="button"
                    className="secondary-button small-button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSaving}
                  >
                    <FiUpload aria-hidden="true" /> Choose image
                  </button>
                  {imageFile && (
                    <button type="button" className="ghost-button small-button" onClick={() => setImageFile(null)} disabled={isSaving}>
                      <FiX aria-hidden="true" /> Discard
                    </button>
                  )}
                </div>
                <span className="field-hint">
                  {imageFile ? `${imageFile.name} will be uploaded when you save.` : 'PNG or JPG, up to 5 MB.'}
                </span>
              </>
            ) : (
              <span className="field-hint">
                Picture uploads aren&apos;t configured for this deployment (set the Cloudinary variables in{' '}
                <code>.env</code> to enable them).
              </span>
            )}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="profile-name">Full name</label>
          <input
            id="profile-name"
            type="text"
            className="input-field"
            autoComplete="name"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="profile-email">Email</label>
          <input id="profile-email" type="email" className="input-field" value={profile.email || ''} readOnly disabled aria-describedby="profile-email-hint" />
          <span id="profile-email-hint" className="field-hint">
            Your login email can&apos;t be changed.
          </span>
        </div>
        <div className="form-group">
          <label htmlFor="profile-recovery">Recovery email (optional)</label>
          <input
            id="profile-recovery"
            type="email"
            className="input-field"
            autoComplete="off"
            value={form.recovery_email}
            onChange={(e) => setForm((prev) => ({ ...prev, recovery_email: e.target.value }))}
          />
        </div>
        <div className="form-actions">
          <button type="submit" className="primary-button" disabled={isSaving}>
            {isSaving ? 'Saving…' : 'Save profile'}
          </button>
        </div>
      </form>
    </section>
  );
};

// ---------------------------------------------------------------------------
// Preferences (currency)
// ---------------------------------------------------------------------------
const PreferencesSection = ({ profile, onSaved }) => {
  const [currency, setCurrency] = useState(profile.currency_preference || 'USD');
  const [isSaving, setIsSaving] = useState(false);
  const isDirty = currency !== (profile.currency_preference || 'USD');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      const saved = await updateUserProfile({ currency_preference: currency });
      onSaved(saved);
      toast.success(`Amounts will now be shown in ${currency}.`);
    } catch (err) {
      toast.error(err.message || 'Could not update your currency.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section id="preferences" className="card settings-page__section" aria-labelledby="settings-preferences-title">
      <h2 id="settings-preferences-title" className="card-title">
        Preferences
      </h2>
      <form onSubmit={handleSubmit} className="settings-page__inline-form">
        <div className="form-group">
          <label htmlFor="settings-currency">Currency for personal budgets</label>
          <select id="settings-currency" className="select-field" value={currency} onChange={(e) => setCurrency(e.target.value)}>
            {CURRENCIES.map(({ code, label }) => (
              <option key={code} value={code}>
                {code} – {label}
              </option>
            ))}
          </select>
          <span className="field-hint">Family plans keep their own currency.</span>
        </div>
        <button type="submit" className="primary-button" disabled={!isDirty || isSaving}>
          {isSaving ? 'Saving…' : 'Save'}
        </button>
      </form>
      <p className="field-hint settings-page__note">
        Expense categories are managed on the <Link to="/budget-management">Budget management</Link> page.
      </p>
    </section>
  );
};

// ---------------------------------------------------------------------------
// Password
// ---------------------------------------------------------------------------
const PasswordSection = ({ onPasswordChanged }) => {
  const empty = { currentPassword: '', newPassword: '', confirmPassword: '' };
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const next = {};
    if (!form.currentPassword) next.currentPassword = 'Enter your current password.';
    if (form.newPassword.length < MIN_PASSWORD_LENGTH) next.newPassword = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
    else if (form.newPassword === form.currentPassword) next.newPassword = 'Choose a password you are not already using.';
    if (form.confirmPassword !== form.newPassword) next.confirmPassword = 'Passwords do not match.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setIsSaving(true);
    try {
      const response = await updateUserProfile({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      onPasswordChanged(response);
      setForm(empty);
      toast.success('Password changed. Other devices have been signed out.');
    } catch (err) {
      if (err.status === 400 && /current/i.test(err.message || '')) {
        setErrors({ currentPassword: err.message });
      }
      toast.error(err.message || 'Could not change your password.');
    } finally {
      setIsSaving(false);
    }
  };

  const fieldProps = (name, autoComplete) => ({
    id: `password-${name}`,
    name,
    type: 'password',
    className: 'input-field',
    autoComplete,
    value: form[name],
    onChange: handleChange,
    'aria-invalid': Boolean(errors[name]),
    'aria-describedby': errors[name] ? `password-${name}-error` : undefined,
  });

  const fieldError = (name) =>
    errors[name] ? (
      <span id={`password-${name}-error`} className="field-error">
        {errors[name]}
      </span>
    ) : null;

  return (
    <section id="security" className="card settings-page__section" aria-labelledby="settings-password-title">
      <h2 id="settings-password-title" className="card-title">
        Change password
      </h2>
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="password-currentPassword">Current password</label>
          <input {...fieldProps('currentPassword', 'current-password')} required />
          {fieldError('currentPassword')}
        </div>
        <div className="settings-page__two-col">
          <div className="form-group">
            <label htmlFor="password-newPassword">New password</label>
            <input {...fieldProps('newPassword', 'new-password')} minLength={MIN_PASSWORD_LENGTH} required />
            {fieldError('newPassword') || <span className="field-hint">At least {MIN_PASSWORD_LENGTH} characters.</span>}
          </div>
          <div className="form-group">
            <label htmlFor="password-confirmPassword">Confirm new password</label>
            <input {...fieldProps('confirmPassword', 'new-password')} required />
            {fieldError('confirmPassword')}
          </div>
        </div>
        <div className="form-actions">
          <button type="submit" className="primary-button" disabled={isSaving}>
            {isSaving ? 'Updating…' : 'Change password'}
          </button>
        </div>
      </form>
    </section>
  );
};

// ---------------------------------------------------------------------------
// Pending family plan invitations
// ---------------------------------------------------------------------------
const InvitationsSection = () => {
  const { data, setData, loading, error, reload } = useAsyncData(loadInvitations, { initialData: [] });
  const invitations = data || [];
  const [busyId, setBusyId] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [rejectError, setRejectError] = useState('');

  const removeInvite = (id) => setData((prev) => (prev || []).filter((invite) => invite._id !== id));

  const handleAccept = async (invite) => {
    setBusyId(invite._id);
    try {
      await acceptInvitation(invite._id);
      removeInvite(invite._id);
      toast.success(`You joined "${invite.plan_name}". Find it under Shared Budgeting.`);
    } catch (err) {
      toast.error(err.message || 'Could not accept the invitation.');
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async () => {
    setBusyId(rejecting._id);
    setRejectError('');
    try {
      await rejectInvitation(rejecting._id);
      removeInvite(rejecting._id);
      toast.success('Invitation declined.');
      setRejecting(null);
    } catch (err) {
      setRejectError(err.message || 'Could not decline the invitation.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section id="invitations" className="card settings-page__section" aria-labelledby="settings-invites-title">
      <h2 id="settings-invites-title" className="card-title">
        Pending invitations
      </h2>
      <SectionState
        loading={loading}
        error={error}
        onRetry={reload}
        empty={invitations.length === 0}
        emptyMessage="You have no pending family plan invitations."
      >
        <ul className="settings-page__invites">
          {invitations.map((invite) => (
            <li key={invite._id} className="settings-page__invite">
              <div className="settings-page__invite-details">
                <h3>{invite.plan_name || 'Family plan'}</h3>
                <p>
                  Invited by <strong>{invite.inviter_name || 'a plan admin'}</strong> as{' '}
                  <span className="settings-page__role">{invite.role_assigned}</span>
                </p>
                <p className="field-hint">
                  Received {formatRelativeTime(invite.created_at)}
                  {invite.expires_at ? ` · expires ${formatLocalDate(invite.expires_at)}` : ''}
                </p>
              </div>
              <div className="settings-page__invite-actions">
                <button
                  type="button"
                  className="primary-button small-button"
                  onClick={() => handleAccept(invite)}
                  disabled={busyId === invite._id}
                >
                  <FiCheck aria-hidden="true" /> Accept
                </button>
                <button
                  type="button"
                  className="secondary-button small-button"
                  onClick={() => {
                    setRejectError('');
                    setRejecting(invite);
                  }}
                  disabled={busyId === invite._id}
                >
                  <FiX aria-hidden="true" /> Decline
                </button>
              </div>
            </li>
          ))}
        </ul>
      </SectionState>

      <ConfirmDialog
        isOpen={rejecting !== null}
        title="Decline invitation"
        message={
          <>
            Decline the invitation to join <strong>{rejecting?.plan_name}</strong> from{' '}
            {rejecting?.inviter_name || 'this user'}?
          </>
        }
        confirmLabel="Decline"
        busy={busyId !== null && busyId === rejecting?._id}
        error={rejectError}
        onConfirm={handleReject}
        onCancel={() => setRejecting(null)}
      />
    </section>
  );
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
const SettingsPage = () => {
  const { login, logout, updateUser } = useAuth();
  const profile = useAsyncData(getUserProfile);

  const handleProfileSaved = (saved) => {
    profile.setData(saved);
    updateUser(toSessionUser(saved));
  };

  // A password change invalidates every session and returns a fresh token with the profile.
  const handlePasswordChanged = (response) => {
    if (!response) return;
    const { token, ...savedProfile } = response;
    profile.setData(savedProfile);
    if (token) login(token, toSessionUser(savedProfile));
    else updateUser(toSessionUser(savedProfile));
  };

  return (
    <AppLayout className="settings-page">
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p className="page-subtitle">Manage your profile, preferences and invitations.</p>
        </div>
        <button type="button" className="secondary-button" onClick={logout}>
          <FiLogOut aria-hidden="true" /> Log out
        </button>
      </div>

      <nav className="settings-page__quick-links" aria-label="Settings sections">
        <a href="#profile">Profile</a>
        <a href="#preferences">Preferences</a>
        <a href="#security">Password</a>
        <a href="#invitations">Invitations</a>
      </nav>

      <SectionState loading={profile.loading} error={profile.error} onRetry={profile.reload} loadingMessage="Loading your profile…">
        {profile.data && (
          <>
            <ProfileSection key={`profile-${profile.data._id}`} profile={profile.data} onSaved={handleProfileSaved} />
            <PreferencesSection
              key={`prefs-${profile.data.currency_preference}`}
              profile={profile.data}
              onSaved={handleProfileSaved}
            />
            <PasswordSection onPasswordChanged={handlePasswordChanged} />
          </>
        )}
      </SectionState>

      <InvitationsSection />
    </AppLayout>
  );
};

export default SettingsPage;
