const MonthlyBudget = require('../models/MonthlyBudget');
const { startOfUtcDay, addDays, toMonthYear, monthRange } = require('./dates');

/** The monthly budget whose date range contains `date`, if any. */
function findBudgetCovering(userId, date) {
  const day = startOfUtcDay(date);
  return MonthlyBudget.findOne({ user_id: userId, start_date: { $lte: day }, end_date: { $gte: day } }).sort({
    start_date: -1,
  });
}

/**
 * The monthly budget to show as "current": the one whose date range contains today, or
 * failing that the one filed under the current month (e.g. a period that starts later this month).
 */
async function findCurrentMonthlyBudget(userId, now = new Date()) {
  return (
    (await findBudgetCovering(userId, now)) ||
    MonthlyBudget.findOne({ user_id: userId, month_year: toMonthYear(startOfUtcDay(now)) })
  );
}

/**
 * The budgeting period containing `date`: the date range of the monthly budget covering it, or
 * that date's calendar month (UTC) when no budget covers it. `endExclusive` is the day after the
 * period, and `monthYear` is the key category limits are filed under.
 */
async function getPeriodForDate(userId, date) {
  const budget = await findBudgetCovering(userId, date);
  if (budget) {
    return {
      start: startOfUtcDay(budget.start_date),
      endExclusive: addDays(startOfUtcDay(budget.end_date), 1),
      monthYear: budget.month_year,
      source: 'budget',
    };
  }
  const monthYear = toMonthYear(startOfUtcDay(date));
  return { ...monthRange(monthYear), monthYear, source: 'calendar' };
}

/** The user's current budgeting period (see getPeriodForDate). */
const getCurrentPeriod = (userId, now = new Date()) => getPeriodForDate(userId, now);

/** JSON-friendly representation with an inclusive end date. */
const describePeriod = ({ start, endExclusive, source }) => ({
  start: start.toISOString(),
  end: addDays(endExclusive, -1).toISOString(),
  source,
});

module.exports = { findCurrentMonthlyBudget, getPeriodForDate, getCurrentPeriod, describePeriod };
