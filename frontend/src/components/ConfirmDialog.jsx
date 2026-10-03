import { useState } from 'react';
import Modal from './Modal';

/**
 * Yes/no confirmation built on Modal.
 *
 * Pass `busy`/`error` to control the state yourself, or leave them out and return a promise
 * from `onConfirm`: the dialog then shows "Working…" while it runs and displays the error
 * message (staying open) if it rejects.
 */
const ConfirmDialog = ({
  isOpen,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  tone = 'danger',
  busy,
  error,
  onConfirm,
  onCancel,
  onClose,
}) => {
  const [running, setRunning] = useState(false);
  const [failure, setFailure] = useState(null);

  const controlled = busy !== undefined;
  const isBusy = controlled ? busy : running;
  const shownError = error !== undefined ? error : failure;
  const handleCancel = onCancel || onClose;

  const handleConfirm = async () => {
    if (controlled) {
      onConfirm?.();
      return;
    }
    setRunning(true);
    setFailure(null);
    try {
      await onConfirm?.();
    } catch (err) {
      setFailure(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setRunning(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={isBusy ? () => {} : handleCancel} title={title}>
      {shownError && (
        <p className="error-message" role="alert">
          {shownError}
        </p>
      )}
      <div className="confirmation-text">{message}</div>
      <div className="confirmation-actions">
        <button type="button" className="secondary-button" onClick={handleCancel} disabled={isBusy}>
          {cancelLabel}
        </button>
        <button
          type="button"
          className={tone === 'danger' ? 'danger-button' : 'primary-button'}
          onClick={handleConfirm}
          disabled={isBusy}
          data-autofocus
        >
          {isBusy ? 'Working…' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
