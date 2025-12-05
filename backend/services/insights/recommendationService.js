const Expense = require('../../models/Expense');
const FamilyExpense = require('../../models/FamilyExpense');
const MonthlyBudget = require('../../models/MonthlyBudget');
const mongoose = require('mongoose');
const { startOfMonth, endOfMonth, subMonths, format, startOfDay, endOfDay } = require('date-fns');

// Simple in-memory cache (TTL 60s)
const cache = {};
const CACHE_TTL_MS = 60 * 1000;

const sumAmounts = (records = []) => records.reduce((acc, item) => acc + (item.amount || 0), 0);

const getRangeForPeriod = (period, now = new Date()) => {
  const today = now;
  if (period === 'this-month') {
    return { start: startOfMonth(today), end: endOfMonth(today) };
  }
  if (period === 'last-month') {
    const start = startOfMonth(subMonths(today, 1));
    const end = endOfMonth(subMonths(today, 1));
    return { start, end };
  }
  if (period === 'last-3-months') {
    const start = startOfMonth(subMonths(today, 2));
    const end = endOfMonth(today);
    return { start, end };
  }
  return null;
};

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

// Robust anomaly detection: min spend per day, min days, capped z-score
const detectDailyAnomalies = (expenses = []) => {
  if (!expenses.length) return [];
  const dailyMap = expenses.reduce((map, expense) => {
    const key = format(startOfDay(new Date(expense.expense_date)), 'yyyy-MM-dd');
    map[key] = (map[key] || 0) + (expense.amount || 0);
    return map;
  }, {});

  const entries = Object.entries(dailyMap)
    .map(([date, amount]) => ({ date, amount }))
    .filter((d) => d.amount >= 500);

  if (entries.length < 5) return [];

  // median & MAD
  const values = entries.map((e) => e.amount).sort((a, b) => a - b);
  const median = values[Math.floor(values.length / 2)];
  const absDeviations = values.map((v) => Math.abs(v - median));
  const mad = absDeviations.sort((a, b) => a - b)[Math.floor(absDeviations.length / 2)] || 0;
  if (mad === 0) return [];

  const anomalies = entries.filter((e) => {
    const z = 0.6745 * (e.amount - median) / mad; // approximated z from MAD
    return z > 3; // capped z-score threshold
  }).map((e) => ({ date: e.date, amount: e.amount, threshold: median + 3 * mad }));

  return anomalies;
};

// Forecast next month using moving average of last 3 full months (excluding current)
const forecastNextMonth = async ({ filter, now = new Date(), useFamily = false }) => {
  const rangeStart = startOfMonth(subMonths(now, 3));
  const rangeEnd = endOfMonth(subMonths(now, 1));

  const Model = useFamily ? FamilyExpense : Expense;

  const totals = await Model.aggregate([
    { $match: { ...filter, expense_date: { $gte: rangeStart, $lte: rangeEnd } } },
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
  if (monthlyTotals.length < 2) {
    return { projection: null, average: null, monthsUsed: monthlyTotals.length, notEnoughData: true };
  }

  const average = monthlyTotals.reduce((acc, val) => acc + val, 0) / monthlyTotals.length;
  return {
    projection: average,
    average,
    monthsUsed: monthlyTotals.length,
    notEnoughData: false,
  };
};

const buildCategoryInsights = async ({ filter, typicalFilter, useFamily = false }) => {
  const Model = useFamily ? FamilyExpense : Expense;

  // Current period spending per category
  const current = await Model.aggregate([
    { $match: filter },
    {
      $group: {
        _id: '$category_id',
        total: { $sum: '$amount' },
      },
    },
    {
      $lookup: {
        from: 'categories',
        localField: '_id',
        foreignField: '_id',
        as: 'category',
      },
    },
    { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        category: { $ifNull: ['$category.name', 'Uncategorized'] },
        amount: '$total',
      },
    },
  ]);

  // Typical spending (last 3 months, excluding current month)
  const typical = await Model.aggregate([
    { $match: typicalFilter },
    {
      $group: {
        _id: '$category_id',
        total: { $sum: '$amount' },
      },
    },
    {
      $lookup: {
        from: 'categories',
        localField: '_id',
        foreignField: '_id',
        as: 'category',
      },
    },
    { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        category: { $ifNull: ['$category.name', 'Uncategorized'] },
        amount: '$total',
      },
    },
  ]);

  const typicalMap = typical.reduce((acc, item) => {
    acc[item.category] = item.amount;
    return acc;
  }, {});

  const enriched = current.map((item) => {
    const typicalAmt = typicalMap[item.category] || 0;
    const delta = item.amount - typicalAmt;
    return { category: item.category, amount: item.amount, typical: typicalAmt, delta };
  });

  const topOverspend = enriched
    .filter((c) => c.delta > 0)
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 3);

  const topUnderspend = enriched
    .filter((c) => c.delta < 0)
    .sort((a, b) => a.delta - b.delta)
    .slice(0, 3);

  return { topOverspend, topUnderspend };
};

const getRecommendations = async ({ userId, period = 'this-month', planId = null, now = new Date() }) => {
  const cacheKey = `${userId}-${period}-${planId || 'none'}`;
  const cached = cache[cacheKey];
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL_MS) {
    return cached.data;
  }

  const range = getRangeForPeriod(period, now);
  if (!range) {
    throw new Error('INVALID_PERIOD');
  }

  const useFamily = !!planId;
  const filter = useFamily
    ? { plan_id: new mongoose.Types.ObjectId(planId), expense_date: { $gte: range.start, $lte: range.end } }
    : { user_id: new mongoose.Types.ObjectId(userId), expense_date: { $gte: range.start, $lte: range.end } };

  const typicalRangeStart = startOfMonth(subMonths(range.start, 3));
  const typicalRangeEnd = endOfMonth(subMonths(range.start, 1));

  const typicalFilter = useFamily
    ? { plan_id: new mongoose.Types.ObjectId(planId), expense_date: { $gte: typicalRangeStart, $lte: typicalRangeEnd } }
    : { user_id: new mongoose.Types.ObjectId(userId), expense_date: { $gte: typicalRangeStart, $lte: typicalRangeEnd } };

  const Model = useFamily ? FamilyExpense : Expense;

  const [expenses, monthlyBudget, forecast] = await Promise.all([
    Model.find(filter).lean(),
    useFamily ? null : MonthlyBudget.findOne({ user_id: userId, month_year: format(now, 'yyyy-MM') }).lean(),
    forecastNextMonth({ filter, now, useFamily }),
  ]);

  const totalSpent = sumAmounts(expenses);
  const budgetTips = buildBudgetTips({ totalSpent, monthlyBudget });
  const anomalies = detectDailyAnomalies(expenses);
  const categoryInsights = await buildCategoryInsights({ filter, typicalFilter, useFamily });

  const result = {
    mode: useFamily ? 'family' : 'personal',
    period,
    summary: {
      totalSpent,
      budgetTarget: monthlyBudget?.total_budget_amount || 0,
    },
    budgetTips,
    anomalies,
    forecast,
    categoryInsights,
  };

  cache[cacheKey] = { timestamp: Date.now(), data: result };
  return result;
};

module.exports = {
  getRecommendations,
};
