import { downloadCsv } from '../../../utils/csv';
import { toDateInputValue } from '../../../utils/format';
import { categoryName } from './planStats';

/** Downloads the given family expenses as a CSV file. */
export function downloadExpensesCsv(expenses, { planName = 'plan', currency = '' } = {}) {
  const header = ['Date', 'Description', 'Category', 'Added by', `Amount${currency ? ` (${currency})` : ''}`, 'Status', 'Notes'];
  const rows = expenses.map((expense) => [
    toDateInputValue(expense.expense_date),
    expense.description,
    categoryName(expense),
    expense.added_by?.name || '',
    Number(expense.amount) || 0,
    expense.status,
    expense.notes,
  ]);
  const safeName = planName.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'plan';
  downloadCsv(`${safeName}-expenses.csv`, header, rows);
}
