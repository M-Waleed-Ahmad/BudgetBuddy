const Expense = require('../../models/Expense');
const MonthlyBudget = require('../../models/MonthlyBudget');
const mongoose = require('mongoose');
const { startOfMonth, endOfMonth, subMonths, format } = require('date-fns');

// Calculate total spent in range
const sumAmounts = (records = []) => records.reduce((acc, item) => acc + (item.amount || 0), 0);

// Generate budget adherence tips
const buildBudgetTips = ({ totalSpent, monthlyBudget }) => {
  const tips = [];
  if (!monthlyBudget) {
    tips.push({
      type: 'info',
      title: 'Set a monthly budget',
      detail: 'Create a monthly budget to get personalized adherence tips.',
    });
    return tips;
  }

  const { total_budget_amount: target = 0 } = monthlyBudget;
  if (target <= 0) {
    tips.push({
      type: 'info',
      title: 'Add a budget target',
      detail: 'Your budget target is missing. Add an amount to start tracking adherence.',
    });
    return tips;
  }

  const utilization = (totalSpent / target) * 100;
  if (utilization >= 110) {
    tips.push({
      type: 'warning',
      title: 'Budget exceeded',
      detail: `You have exceeded your budget by ${Math.round(utilization - 100)}%. Consider pausing non-essential spending for the rest of the month.`,
    });
  } else if (utilization >= 90) {
    tips.push({
      type: 'success',
      title: 'On track',
      detail: 'You are close to your budget target. Keep monitoring daily spend to avoid overruns.',
    });
  } else {
    tips.push({
      type: 'info',
      title: 'Under budget', 
      detail: 'You are under budget. Allocate a portion to savings or upcoming recurring bills.',
    });
  }

  return tips;
};

// Detect daily anomalies (> mean + 2*std)
const detectDailyAnomalies = (expenses = []) => {
  if (!expenses.length) return [];

  const dailyMap = expenses.reduce((map, expense) => {
    const key = format(new Date(expense.expense_date), 'yyyy-MM-dd');
    map[key] = (map[key] || 0) + (expense.amount || 0);
    return map;
  }, {});

  const totals = Object.values(dailyMap);
  if (!totals.length) return [];

  const mean = totals.reduce((acc, val) => acc + val, 0) / totals.length;
  const variance = totals.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / totals.length;
  const stdDev = Math.sqrt(variance);
  const threshold = mean + 2 * stdDev;

  return Object.entries(dailyMap)
    .filter(([, amount]) => amount > threshold)
    .map(([date, amount]) => ({ date, amount, threshold }));
};

// Forecast next month using moving average of last 3 full months (excluding current)
const forecastNextMonth = async (userId, now = new Date()) => {
  const rangeStart = startOfMonth(subMonths(now, 3));
  const rangeEnd = endOfMonth(subMonths(now, 1));

  const totals = await Expense.aggregate([
    {
      $match: {
        user_id: new mongoose.Types.ObjectId(userId),
        expense_date: { $gte: rangeStart, $lte: rangeEnd },
      },
    },
    {
      $project: {
        month: { $dateToString: { format: '%Y-%m', date: '$expense_date' } },
        amount: 1,
      },
    },
    {
      $group: {
        _id: '$month',
        total: { $sum: '$amount' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const monthlyTotals = totals.map((item) => item.total);
  if (!monthlyTotals.length) {
    return { projection: 0, average: 0, monthsUsed: 0 };
  }

  const average = monthlyTotals.reduce((acc, val) => acc + val, 0) / monthlyTotals.length;
  return {
    projection: average,
    average,
    monthsUsed: monthlyTotals.length,
  };
};

const getRecommendationsForThisMonth = async (userId, now = new Date()) => {
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [expenses, monthlyBudget] = await Promise.all([
    Expense.find({ user_id: userId, expense_date: { $gte: monthStart, $lte: monthEnd } }).lean(),
    MonthlyBudget.findOne({ user_id: userId, month_year: format(now, 'yyyy-MM') }).lean(),
  ]);

  const totalSpent = sumAmounts(expenses);

  const [forecast] = await Promise.all([
    forecastNextMonth(userId, now),
  ]);

  return {
    budgetTips: buildBudgetTips({ totalSpent, monthlyBudget }),
    anomalies: detectDailyAnomalies(expenses),
    forecast,
    summary: {
      totalSpent,
      budgetTarget: monthlyBudget?.total_budget_amount || 0,
    },
  };
};

module.exports = {
  getRecommendationsForThisMonth,
};
