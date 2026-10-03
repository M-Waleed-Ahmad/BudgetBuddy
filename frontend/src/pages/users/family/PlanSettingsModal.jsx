import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Modal from '../../../components/Modal';
import { getPlanCategories, updatePlanSettings } from '../../../api';
import { formatCurrency } from '../../../utils/format';
import PlanFields from './PlanFields';
import { planValuesFromDetails, toPlanPayload, validatePlanValues } from './planForm';
import { ErrorState, LoadingState } from './SectionStatus';

/** Plan settings for admins: plan fields plus per-category limits. */
export default function PlanSettingsModal({ isOpen, onClose, plan, isOwner, onSaved }) {
  const [values, setValues] = useState(() => planValuesFromDetails(plan));
  const [limits, setLimits] = useState([]);
  const [categoriesState, setCategoriesState] = useState({ loading: true, error: null });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const planId = plan?._id;

  const loadCategories = useCallback(async () => {
    if (!planId) return;
    setCategoriesState({ loading: true, error: null });
    try {
      const categories = await getPlanCategories(planId);
      setLimits(
        (categories || []).map((category) => ({
          id: category._id,
          name: category.name,
          limit: category.limitAmount ? String(category.limitAmount) : '',
        }))
      );
      setCategoriesState({ loading: false, error: null });
    } catch (err) {
      setCategoriesState({ loading: false, error: err.message || 'Could not load categories.' });
    }
  }, [planId]);

  useEffect(() => {
    if (isOpen) loadCategories();
  }, [isOpen, loadCategories]);

  const handleChange = (name, value) => setValues((prev) => ({ ...prev, [name]: value }));
  const handleLimitChange = (id, limit) =>
    setLimits((prev) => prev.map((row) => (row.id === id ? { ...row, limit } : row)));

  const currency = values.currency;
  const total = Number(values.total_budget_amount) || 0;
  const allocated = limits.reduce((sum, row) => sum + (Number(row.limit) || 0), 0);
  const overAllocated = total > 0 && allocated > total;
  const categoriesReady = !categoriesState.loading && !categoriesState.error;

  const handleSubmit = async (event) => {
    event.preventDefault();
    let validationError = validatePlanValues(values);
    if (!validationError && limits.some((row) => row.limit !== '' && !(Number(row.limit) >= 0))) {
      validationError = 'Category limits must be zero or positive numbers.';
    }
    if (!validationError && categoriesReady && overAllocated) {
      validationError = `Category limits add up to ${formatCurrency(allocated, currency)}, which is more than the plan total of ${formatCurrency(total, currency)}.`;
    }
    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = toPlanPayload(values);
    if (categoriesReady) {
      payload.categoryBudgets = limits.map((row) => ({ category_id: row.id, limit_amount: Number(row.limit) || 0 }));
    }

    setError(null);
    setSubmitting(true);
    try {
      const updated = await updatePlanSettings(planId, payload);
      toast.success('Plan settings saved.');
      await onSaved?.(updated);
      onClose();
    } catch (err) {
      setError(err.message || 'Could not save the settings.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Plan settings">
      <form className="family-form" onSubmit={handleSubmit} noValidate>
        {error && (
          <p className="family-form-error" role="alert">
            {error}
          </p>
        )}
        <PlanFields idPrefix="plan-settings" values={values} onChange={handleChange} disabled={submitting} />

        <fieldset className="family-fieldset" disabled={submitting}>
          <legend>Category limits</legend>
          <p className="family-form-hint">
            Limits use the plan owner&apos;s spending categories. Leave a field empty or set it to 0 to remove that
            limit.
          </p>

          {categoriesState.loading && <LoadingState label="Loading categories…" />}
          {categoriesState.error && <ErrorState message={categoriesState.error} onRetry={loadCategories} />}
          {categoriesReady && limits.length === 0 && (
            <p className="family-form-hint">
              {isOwner ? (
                <>
                  You don&apos;t have any categories yet. Create them on the{' '}
                  <Link to="/budget-management">Budget Management</Link> page, then come back to set limits.
                </>
              ) : (
                'The plan owner has no categories yet. Once they create some on their Budget Management page, you can set limits here.'
              )}
            </p>
          )}

          {categoriesReady && limits.length > 0 && (
            <>
              <ul className="family-limit-list">
                {limits.map((row) => (
                  <li key={row.id} className="family-limit-row">
                    <label htmlFor={`limit-${row.id}`}>{row.name}</label>
                    <input
                      id={`limit-${row.id}`}
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      className="family-input"
                      value={row.limit}
                      placeholder="No limit"
                      onChange={(event) => handleLimitChange(row.id, event.target.value)}
                    />
                  </li>
                ))}
              </ul>
              <p className={`family-allocation${overAllocated ? ' family-allocation--over' : ''}`} aria-live="polite">
                Allocated <strong>{formatCurrency(allocated, currency)}</strong>
                {total > 0 ? (
                  <>
                    {' '}of <strong>{formatCurrency(total, currency)}</strong>
                    {overAllocated
                      ? ` — ${formatCurrency(allocated - total, currency)} over the plan total`
                      : ` — ${formatCurrency(total - allocated, currency)} unallocated`}
                  </>
                ) : (
                  ' (no plan total set)'
                )}
              </p>
            </>
          )}
        </fieldset>

        <div className="family-form-actions">
          <button type="button" className="family-btn family-btn--secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="family-btn family-btn--primary" disabled={submitting || (categoriesReady && overAllocated)}>
            {submitting ? 'Saving…' : 'Save settings'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
