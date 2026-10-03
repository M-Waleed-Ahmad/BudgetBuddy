import { FiPlus, FiRefreshCw } from 'react-icons/fi';
import { roleLabel } from './permissions';
import { ErrorState } from './SectionStatus';

/** Plan picker. Stays usable while other sections load or fail. */
export default function PlanSelector({ plans, selectedPlanId, onSelect, loading, error, onRetry, onCreate }) {
  const hasPlans = plans.length > 0;

  return (
    <section className="family-card family-selector" aria-label="Plan selection">
      <div className="family-selector__row">
        <div className="family-selector__field">
          <label htmlFor="family-plan-select">Plan</label>
          <select
            id="family-plan-select"
            className="family-input"
            value={selectedPlanId}
            onChange={(event) => onSelect(event.target.value)}
            disabled={!hasPlans}
          >
            {!hasPlans && <option value="">{loading ? 'Loading plans…' : 'No plans yet'}</option>}
            {hasPlans && !selectedPlanId && (
              <option value="" disabled>
                Select a plan
              </option>
            )}
            {plans.map((plan) => (
              <option key={plan._id} value={plan._id}>
                {plan.plan_name} · {roleLabel(plan.userRole)}
              </option>
            ))}
          </select>
        </div>
        <div className="family-selector__actions">
          <button
            type="button"
            className="family-btn family-btn--ghost family-btn--icon"
            onClick={onRetry}
            disabled={loading}
            aria-label="Reload plans"
            title="Reload plans"
          >
            <FiRefreshCw aria-hidden="true" className={loading ? 'family-spin' : undefined} />
          </button>
          <button type="button" className="family-btn family-btn--primary" onClick={onCreate}>
            <FiPlus aria-hidden="true" /> New plan
          </button>
        </div>
      </div>
      {error && <ErrorState message={error} onRetry={onRetry} retrying={loading} />}
    </section>
  );
}
