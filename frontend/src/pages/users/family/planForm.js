import { toDateInputValue } from '../../../utils/format';

export function emptyPlanValues(currency = 'USD') {
  return {
    plan_name: '',
    total_budget_amount: '',
    start_date: '',
    end_date: '',
    currency,
    require_approval: false,
  };
}

export function planValuesFromDetails(details) {
  return {
    plan_name: details?.plan_name || '',
    total_budget_amount: details?.total_budget_amount ? String(details.total_budget_amount) : '',
    start_date: toDateInputValue(details?.start_date),
    end_date: toDateInputValue(details?.end_date),
    currency: details?.currency || 'USD',
    require_approval: Boolean(details?.require_approval),
  };
}

/** Returns a human-readable validation error, or null when the values are valid. */
export function validatePlanValues(values) {
  if (!values.plan_name.trim()) return 'Please enter a plan name.';
  if (values.total_budget_amount !== '') {
    const total = Number(values.total_budget_amount);
    if (!Number.isFinite(total) || total < 0) return 'The total budget must be zero or a positive number.';
  }
  if (values.start_date && values.end_date && values.end_date < values.start_date) {
    return 'The end date must be on or after the start date.';
  }
  return null;
}

/** Builds the request body shared by "create plan" and "update settings". Empty optional fields are sent as null to clear them. */
export function toPlanPayload(values) {
  return {
    plan_name: values.plan_name.trim(),
    currency: values.currency,
    require_approval: values.require_approval,
    total_budget_amount: values.total_budget_amount === '' ? null : Number(values.total_budget_amount),
    start_date: values.start_date || null,
    end_date: values.end_date || null,
  };
}
