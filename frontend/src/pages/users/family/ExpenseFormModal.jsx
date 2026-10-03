import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '../../../components/Modal';
import { createFamilyExpense, updateFamilyExpense } from '../../../api';
import { formatCurrency, toDateInputValue, todayInputValue } from '../../../utils/format';
import { categoryKey } from './planStats';

function initialValues(expense, categories) {
  if (expense) {
    return {
      expense_date: toDateInputValue(expense.expense_date) || todayInputValue(),
      category_id: expense.category?._id ? String(expense.category._id) : '',
      amount: expense.amount != null ? String(expense.amount) : '',
      description: expense.description || '',
      notes: expense.notes || '',
    };
  }
  return {
    expense_date: todayInputValue(),
    category_id: categories[0]?._id ? String(categories[0]._id) : '',
    amount: '',
    description: '',
    notes: '',
  };
}

/** Adds a family expense, or edits one when `expense` is given. */
export default function ExpenseFormModal({
  isOpen,
  onClose,
  planId,
  currency,
  expense = null,
  categories = [],
  expenses = [],
  needsApproval = false,
  onSaved,
}) {
  const isEdit = Boolean(expense);
  const [values, setValues] = useState(() => initialValues(expense, categories));
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  // Soft warning when this expense would push its category over the plan limit.
  const limitWarning = useMemo(() => {
    const category = categories.find((item) => String(item._id) === values.category_id);
    const limit = Number(category?.limitAmount) || 0;
    const amount = Number(values.amount) || 0;
    if (!category || limit <= 0 || amount <= 0) return null;
    const spent = expenses
      .filter((item) => item.status === 'approved' && item._id !== expense?._id && categoryKey(item) === values.category_id)
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const over = spent + amount - limit;
    return over > 0
      ? `This puts ${category.name} ${formatCurrency(over, currency)} over its ${formatCurrency(limit, currency)} limit.`
      : null;
  }, [categories, expenses, expense, values.category_id, values.amount, currency]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const amount = Number(values.amount);
    let validationError = null;
    if (!values.expense_date) validationError = 'Please pick a date.';
    else if (!values.category_id) validationError = 'Please choose a category.';
    else if (!values.description.trim()) validationError = 'Please add a short description.';
    else if (!Number.isFinite(amount) || amount <= 0) validationError = 'The amount must be greater than zero.';
    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = {
      category_id: values.category_id,
      amount,
      description: values.description.trim(),
      notes: values.notes.trim(),
      expense_date: values.expense_date,
    };

    setError(null);
    setSubmitting(true);
    try {
      const saved = isEdit
        ? await updateFamilyExpense(planId, expense._id, payload)
        : await createFamilyExpense(planId, payload);
      if (saved?.status === 'pending') toast.success('Expense saved and sent to an admin for approval.');
      else toast.success(isEdit ? 'Expense updated.' : 'Expense added.');
      await onSaved?.(saved);
      onClose();
    } catch (err) {
      setError(err.message || 'Could not save the expense.');
    } finally {
      setSubmitting(false);
    }
  };

  const prefix = isEdit ? 'edit-expense' : 'add-expense';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit family expense' : 'Add family expense'}>
      <form className="family-form" onSubmit={handleSubmit} noValidate>
        {needsApproval && (
          <p className="family-form-hint">This plan requires approval, so an admin will review this expense.</p>
        )}
        {error && (
          <p className="family-form-error" role="alert">
            {error}
          </p>
        )}

        <div className="family-field-row">
          <div className="family-field">
            <label htmlFor={`${prefix}-date`}>Date</label>
            <input
              id={`${prefix}-date`}
              name="expense_date"
              type="date"
              className="family-input"
              value={values.expense_date}
              onChange={handleChange}
              required
              disabled={submitting}
            />
          </div>
          <div className="family-field">
            <label htmlFor={`${prefix}-amount`}>Amount ({currency})</label>
            <input
              id={`${prefix}-amount`}
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              inputMode="decimal"
              className="family-input"
              value={values.amount}
              onChange={handleChange}
              placeholder="0.00"
              required
              disabled={submitting}
              autoFocus
            />
          </div>
        </div>

        <div className="family-field">
          <label htmlFor={`${prefix}-category`}>Category</label>
          <select
            id={`${prefix}-category`}
            name="category_id"
            className="family-input"
            value={values.category_id}
            onChange={handleChange}
            required
            disabled={submitting}
          >
            <option value="" disabled>
              Select a category
            </option>
            {categories.map((category) => (
              <option key={category._id} value={String(category._id)}>
                {category.name}
              </option>
            ))}
          </select>
          {limitWarning && (
            <p className="family-field-warning" role="status">
              {limitWarning}
            </p>
          )}
        </div>

        <div className="family-field">
          <label htmlFor={`${prefix}-description`}>Description</label>
          <input
            id={`${prefix}-description`}
            name="description"
            type="text"
            className="family-input"
            value={values.description}
            onChange={handleChange}
            placeholder="e.g. Weekly groceries"
            maxLength={200}
            required
            disabled={submitting}
          />
        </div>

        <div className="family-field">
          <label htmlFor={`${prefix}-notes`}>Notes (optional)</label>
          <textarea
            id={`${prefix}-notes`}
            name="notes"
            className="family-input family-textarea"
            value={values.notes}
            onChange={handleChange}
            rows={3}
            maxLength={500}
            disabled={submitting}
          />
        </div>

        <div className="family-form-actions">
          <button type="button" className="family-btn family-btn--secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="family-btn family-btn--primary" disabled={submitting}>
            {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Add expense'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
