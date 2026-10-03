import { FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';

export function LoadingState({ label = 'Loading…' }) {
  return (
    <p className="family-status family-status--loading" role="status">
      <span className="family-spinner" aria-hidden="true" />
      {label}
    </p>
  );
}

export function ErrorState({ message, onRetry, retrying = false }) {
  return (
    <div className="family-status family-status--error" role="alert">
      <FiAlertTriangle aria-hidden="true" />
      <span>{message}</span>
      {onRetry && (
        <button type="button" className="family-btn family-btn--ghost family-btn--sm" onClick={onRetry} disabled={retrying}>
          <FiRefreshCw aria-hidden="true" /> {retrying ? 'Retrying…' : 'Retry'}
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, children, action }) {
  return (
    <div className="family-empty">
      {title && <p className="family-empty__title">{title}</p>}
      {children && <div className="family-empty__text">{children}</div>}
      {action}
    </div>
  );
}
