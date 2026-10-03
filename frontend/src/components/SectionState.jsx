/**
 * Renders the loading / error / empty state of a page section, or its children
 * when the data is ready.
 */
const SectionState = ({ loading, error, empty, emptyMessage = 'Nothing to show yet.', loadingMessage = 'Loading…', onRetry, children }) => {
  if (loading) {
    return (
      <div className="section-state" role="status">
        <span className="spinner" aria-hidden="true" />
        <p>{loadingMessage}</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="section-state is-error" role="alert">
        <p>{error}</p>
        {onRetry && (
          <button type="button" className="secondary-button small-button" onClick={onRetry}>
            Try again
          </button>
        )}
      </div>
    );
  }
  if (empty) {
    return typeof emptyMessage === 'string' ? (
      <div className="section-state">
        <p>{emptyMessage}</p>
      </div>
    ) : (
      <div className="section-state">{emptyMessage}</div>
    );
  }
  return children;
};

export default SectionState;
