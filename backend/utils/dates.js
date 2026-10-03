// All calendar dates are stored as UTC midnight, so date math here is done in UTC.

const DAY_MS = 24 * 60 * 60 * 1000;

const startOfUtcDay = (date = new Date()) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

const addDays = (date, days) => new Date(date.getTime() + days * DAY_MS);

/** Date -> 'YYYY-MM' (UTC). */
const toMonthYear = (date) => `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;

/** 'YYYY-MM' -> { start, endExclusive } as UTC dates. */
function monthRange(monthYear) {
  const [year, month] = monthYear.split('-').map(Number);
  return {
    start: new Date(Date.UTC(year, month - 1, 1)),
    endExclusive: new Date(Date.UTC(year, month, 1)),
  };
}

/** The last `count` month keys ending with the current one, oldest first. */
function lastMonths(count, now = new Date()) {
  const months = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    months.push(toMonthYear(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1))));
  }
  return months;
}

module.exports = { DAY_MS, startOfUtcDay, addDays, toMonthYear, monthRange, lastMonths };
