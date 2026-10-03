const mongoose = require('mongoose');
const Expense = require('../models/Expense');
const v = require('../utils/validation');
const { addDays, lastMonths, monthRange, toMonthYear } = require('../utils/dates');
const { getCurrentPeriod, describePeriod } = require('../utils/period');
const { checkPersonalBudget } = require('../utils/budgetAlerts');
const { notFound } = require('../utils/httpError');
const { findOwnCategory } = require('./categoryController');

const toExpense = (expense) => ({
  _id: expense._id,
  amount: expense.amount,
  description: expense.description || '',
  notes: expense.notes || '',
  expense_date: expense.expense_date,
  category_id: expense.category_id ? { _id: expense.category_id._id, name: expense.category_id.name } : null,
  created_at: expense.created_at,
});

const roundMoney = (value) => Math.round(value * 100) / 100;

function parseLimit(value, fallback, max) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
}

const userObjectId = (req) => new mongoose.Types.ObjectId(req.user.userId);

async function findOwnExpense(userId, id) {
  v.assertObjectId(id, 'expense id');
  const expense = await Expense.findOne({ _id: id, user_id: userId });
  if (!expense) throw notFound('Expense not found.');
  return expense;
}

async function totalBetween(req, start, endExclusive) {
  const [result] = await Expense.aggregate([
    { $match: { user_id: userObjectId(req), expense_date: { $gte: start, $lt: endExclusive } } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  return roundMoney(result ? result.total : 0);
}

// GET /api/expenses?start=&end=&category=&limit=
async function listExpenses(req, res) {
  const filter = { user_id: req.user.userId };
  const start = v.date(req.query.start, 'start', { required: false });
  const end = v.date(req.query.end, 'end', { required: false });
  if (start || end) {
    filter.expense_date = {};
    if (start) filter.expense_date.$gte = start;
    if (end) filter.expense_date.$lt = addDays(end, 1);
  }
  if (req.query.category) filter.category_id = v.assertObjectId(req.query.category, 'category id');

  const expenses = await Expense.find(filter)
    .populate('category_id', 'name')
    .sort({ expense_date: -1, created_at: -1 })
    .limit(parseLimit(req.query.limit, 100, 500));
  res.json(expenses.map(toExpense));
}

// GET /api/expenses/current-month-plan
async function getCurrentPeriodExpenses(req, res) {
  const period = await getCurrentPeriod(req.user.userId);
  const expenses = await Expense.find({
    user_id: req.user.userId,
    expense_date: { $gte: period.start, $lt: period.endExclusive },
  })
    .populate('category_id', 'name')
    .sort({ expense_date: -1, created_at: -1 });

  const totalSpent = roundMoney(expenses.reduce((sum, expense) => sum + expense.amount, 0));
  res.json({ expenses: expenses.map(toExpense), totalSpent, period: describePeriod(period) });
}

// GET /api/expenses/current-month/category-wise
async function getCategoryWiseSpending(req, res) {
  const period = await getCurrentPeriod(req.user.userId);
  const rows = await Expense.aggregate([
    { $match: { user_id: userObjectId(req), expense_date: { $gte: period.start, $lt: period.endExclusive } } },
    { $group: { _id: '$category_id', totalSpent: { $sum: '$amount' } } },
    { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
    {
      $project: {
        _id: 0,
        categoryId: '$_id',
        categoryName: { $ifNull: [{ $arrayElemAt: ['$category.name', 0] }, 'Uncategorized'] },
        totalSpent: 1,
      },
    },
    { $sort: { totalSpent: -1 } },
  ]);
  res.json({ categoryWiseSpending: rows.map((row) => ({ ...row, totalSpent: roundMoney(row.totalSpent) })) });
}

// GET /api/expenses/current-month-total
async function getCurrentPeriodTotal(req, res) {
  const period = await getCurrentPeriod(req.user.userId);
  res.json({ totalSpent: await totalBetween(req, period.start, period.endExclusive) });
}

// GET /api/expenses/trends?months=6
async function getSpendingTrends(req, res) {
  const monthCount = parseLimit(req.query.months, 6, 24);
  const months = lastMonths(monthCount);
  const start = monthRange(months[0]).start;
  const { endExclusive } = monthRange(months[months.length - 1]);

  const rows = await Expense.aggregate([
    { $match: { user_id: userObjectId(req), expense_date: { $gte: start, $lt: endExclusive } } },
    {
      $group: {
        _id: { category: '$category_id', month: { $dateToString: { format: '%Y-%m', date: '$expense_date' } } },
        total: { $sum: '$amount' },
      },
    },
    { $group: { _id: '$_id.category', monthly: { $push: { month: '$_id.month', total: '$total' } } } },
    { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
    {
      $project: {
        _id: 0,
        name: { $ifNull: [{ $arrayElemAt: ['$category.name', 0] }, 'Uncategorized'] },
        monthly: 1,
      },
    },
    { $sort: { name: 1 } },
  ]);

  const categories = rows.map(({ name, monthly }) => {
    const byMonth = Object.fromEntries(monthly.map((item) => [item.month, item.total]));
    return { name, data: months.map((month) => roundMoney(byMonth[month] || 0)) };
  });
  res.json({ months, categories });
}

// GET /api/expenses/recent?limit=5
async function getRecentExpenses(req, res) {
  const expenses = await Expense.find({ user_id: req.user.userId })
    .populate('category_id', 'name')
    .sort({ expense_date: -1, created_at: -1 })
    .limit(parseLimit(req.query.limit, 5, 50));
  res.json(expenses.map(toExpense));
}

// POST /api/expenses
async function createExpense(req, res) {
  const category = await findOwnCategory(req.user.userId, req.body.category_id);
  const expense = await Expense.create({
    user_id: req.user.userId,
    category_id: category._id,
    amount: v.amount(req.body.amount),
    description: v.string(req.body.description, 'description', { max: 200 }) || '',
    notes: v.string(req.body.notes, 'notes', { max: 1000 }) || '',
    expense_date: v.date(req.body.expense_date, 'expense_date'),
  });

  await checkPersonalBudget({
    userId: req.user.userId,
    categoryId: category._id,
    expenseDate: expense.expense_date,
    delta: expense.amount,
  });

  await expense.populate('category_id', 'name');
  res.status(201).json(toExpense(expense));
}

// PUT /api/expenses/:id
async function updateExpense(req, res) {
  const expense = await findOwnExpense(req.user.userId, req.params.id);
  const before = {
    categoryId: String(expense.category_id),
    month: toMonthYear(expense.expense_date),
    amount: expense.amount,
  };
  const { body } = req;

  if (body.category_id !== undefined) {
    expense.category_id = (await findOwnCategory(req.user.userId, body.category_id))._id;
  }
  if (body.amount !== undefined) expense.amount = v.amount(body.amount);
  if (body.description !== undefined) expense.description = v.string(body.description, 'description', { max: 200 }) || '';
  if (body.notes !== undefined) expense.notes = v.string(body.notes, 'notes', { max: 1000 }) || '';
  if (body.expense_date !== undefined) expense.expense_date = v.date(body.expense_date, 'expense_date');

  await expense.save();

  const movedBucket =
    String(expense.category_id) !== before.categoryId || toMonthYear(expense.expense_date) !== before.month;
  await checkPersonalBudget({
    userId: req.user.userId,
    categoryId: expense.category_id,
    expenseDate: expense.expense_date,
    delta: movedBucket ? expense.amount : expense.amount - before.amount,
  });

  await expense.populate('category_id', 'name');
  res.json(toExpense(expense));
}

// DELETE /api/expenses/:id
async function deleteExpense(req, res) {
  const expense = await findOwnExpense(req.user.userId, req.params.id);
  await expense.deleteOne();
  res.json({ message: 'Expense deleted.' });
}

module.exports = {
  listExpenses,
  getCurrentPeriodExpenses,
  getCategoryWiseSpending,
  getCurrentPeriodTotal,
  getSpendingTrends,
  getRecentExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
};
