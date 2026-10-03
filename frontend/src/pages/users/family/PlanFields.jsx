import { CURRENCIES } from '../../../utils/format';

/** The plan fields shared by the create and settings forms. */
export default function PlanFields({ idPrefix, values, onChange, disabled = false }) {
  const field = (name) => `${idPrefix}-${name}`;
  const handle = (event) => {
    const { name, type, value, checked } = event.target;
    onChange(name, type === 'checkbox' ? checked : value);
  };

  return (
    <>
      <div className="family-field">
        <label htmlFor={field('plan_name')}>Plan name</label>
        <input
          id={field('plan_name')}
          name="plan_name"
          type="text"
          className="family-input"
          value={values.plan_name}
          onChange={handle}
          placeholder="e.g. Household, Summer trip"
          maxLength={100}
          required
          disabled={disabled}
          autoFocus
        />
      </div>

      <div className="family-field-row">
        <div className="family-field">
          <label htmlFor={field('total_budget_amount')}>Total budget (optional)</label>
          <input
            id={field('total_budget_amount')}
            name="total_budget_amount"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            className="family-input"
            value={values.total_budget_amount}
            onChange={handle}
            placeholder="0.00"
            disabled={disabled}
          />
        </div>
        <div className="family-field">
          <label htmlFor={field('currency')}>Currency</label>
          <select
            id={field('currency')}
            name="currency"
            className="family-input"
            value={values.currency}
            onChange={handle}
            disabled={disabled}
          >
            {CURRENCIES.map((currency) => (
              <option key={currency.code} value={currency.code}>
                {currency.code} — {currency.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="family-field-row">
        <div className="family-field">
          <label htmlFor={field('start_date')}>Start date (optional)</label>
          <input
            id={field('start_date')}
            name="start_date"
            type="date"
            className="family-input"
            value={values.start_date}
            onChange={handle}
            disabled={disabled}
          />
        </div>
        <div className="family-field">
          <label htmlFor={field('end_date')}>End date (optional)</label>
          <input
            id={field('end_date')}
            name="end_date"
            type="date"
            className="family-input"
            value={values.end_date}
            min={values.start_date || undefined}
            onChange={handle}
            disabled={disabled}
          />
        </div>
      </div>

      <div className="family-field family-field--checkbox">
        <input
          id={field('require_approval')}
          name="require_approval"
          type="checkbox"
          checked={values.require_approval}
          onChange={handle}
          disabled={disabled}
        />
        <label htmlFor={field('require_approval')}>
          Require admin approval for expenses added by editors
        </label>
      </div>
    </>
  );
}
