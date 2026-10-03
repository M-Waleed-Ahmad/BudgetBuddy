// Shared formatting helpers. Calendar dates (expense dates, budget periods) are stored
// by the API as UTC midnight, so they are always rendered in UTC to show the day the
// user picked. Timestamps (created_at, notifications) are rendered in local time.

export const CURRENCIES = [
  { code: 'USD', label: 'US Dollar' },
  { code: 'EUR', label: 'Euro' },
  { code: 'GBP', label: 'British Pound' },
  { code: 'PKR', label: 'Pakistani Rupee' },
  { code: 'INR', label: 'Indian Rupee' },
  { code: 'AED', label: 'UAE Dirham' },
  { code: 'SAR', label: 'Saudi Riyal' },
  { code: 'CAD', label: 'Canadian Dollar' },
  { code: 'AUD', label: 'Australian Dollar' },
  { code: 'JPY', label: 'Japanese Yen' },
];

const currencyFormatters = new Map();

export function formatCurrency(amount, currency = 'USD') {
  const value = Number(amount) || 0;
  let formatter = currencyFormatters.get(currency);
  if (!formatter) {
    try {
      formatter = new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 2 });
    } catch {
      formatter = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
    }
    currencyFormatters.set(currency, formatter);
  }
  return formatter.format(value);
}

function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const str = String(value);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(str) ? new Date(`${str}T00:00:00Z`) : new Date(str);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Formats a calendar date (e.g. "Oct 3, 2026"). Returns an em dash for empty/invalid input. */
export function formatDate(value, options = {}) {
  const date = toDate(value);
  if (!date) return '—';
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
    ...options,
  });
}

/** Formats the local calendar day of a timestamp, e.g. an invitation's expiry (e.g. "Oct 3, 2026"). */
export function formatLocalDate(value) {
  const date = toDate(value);
  if (!date) return '—';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

/** Formats a timestamp in the user's local time zone (e.g. "Oct 3, 2026, 4:05 PM"). */
export function formatDateTime(value) {
  const date = toDate(value);
  if (!date) return '—';
  return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

/** "5 minutes ago", "yesterday", ... */
export function formatRelativeTime(value) {
  const date = toDate(value);
  if (!date) return '';
  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const units = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return 'just now';
}

/** Converts a stored calendar date into the value an <input type="date"> expects. */
export function toDateInputValue(value) {
  const date = toDate(value);
  return date ? date.toISOString().slice(0, 10) : '';
}

/** Today's date in the user's local time zone, as YYYY-MM-DD. */
export function todayInputValue() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

/** Current month in the user's local time zone, as YYYY-MM. */
export function currentYearMonth() {
  return todayInputValue().slice(0, 7);
}

/** "2026-10" -> "October 2026" */
export function formatMonthYear(monthYear) {
  if (!/^\d{4}-\d{2}$/.test(monthYear || '')) return monthYear || '';
  return new Date(`${monthYear}-01T00:00:00Z`).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/** First and last day of the month containing `yearMonth` (YYYY-MM), as YYYY-MM-DD strings. */
export function monthBounds(yearMonth = currentYearMonth()) {
  const [year, month] = yearMonth.split('-').map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return { start: `${yearMonth}-01`, end: `${yearMonth}-${String(lastDay).padStart(2, '0')}` };
}

/** Percentage of `part` in `total`, clamped to 0..100 for progress bars. */
export function percentOf(part, total) {
  if (!total || total <= 0) return 0;
  return Math.min(100, Math.max(0, (Number(part) / Number(total)) * 100));
}

/** "2026-10" -> "Oct 26" (compact label for chart axes). */
export function formatMonthShort(monthYear) {
  if (!/^\d{4}-\d{2}$/.test(monthYear || '')) return monthYear || '';
  return new Date(`${monthYear}-01T00:00:00Z`).toLocaleDateString(undefined, {
    month: 'short',
    year: '2-digit',
    timeZone: 'UTC',
  });
}
