import { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '../../../components/Modal';
import { createFamilyPlan } from '../../../api';
import PlanFields from './PlanFields';
import { emptyPlanValues, toPlanPayload, validatePlanValues } from './planForm';

/** Creates a new family plan. The creator becomes its owner and first admin. */
export default function PlanFormModal({ isOpen, onClose, defaultCurrency, onCreated }) {
  const [values, setValues] = useState(() => emptyPlanValues(defaultCurrency));
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (name, value) => setValues((prev) => ({ ...prev, [name]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validatePlanValues(values);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const plan = await createFamilyPlan(toPlanPayload(values));
      toast.success(`"${plan.plan_name}" created.`);
      await onCreated?.(plan);
      onClose();
    } catch (err) {
      setError(err.message || 'Could not create the plan.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create a family plan">
      <form className="family-form" onSubmit={handleSubmit} noValidate>
        <p className="family-form-hint">
          You&apos;ll be the plan owner. Category limits use your own categories and can be set in Plan settings
          after the plan is created.
        </p>
        {error && (
          <p className="family-form-error" role="alert">
            {error}
          </p>
        )}
        <PlanFields idPrefix="create-plan" values={values} onChange={handleChange} disabled={submitting} />
        <div className="family-form-actions">
          <button type="button" className="family-btn family-btn--secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="family-btn family-btn--primary" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create plan'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
