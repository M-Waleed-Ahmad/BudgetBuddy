const MonthlyBudget = require('../models/MonthlyBudget');
const v = require('../utils/validation');
const { toMonthYear } = require('../utils/dates');
const { findCurrentMonthlyBudget } = require('../utils/period');
const { badRequest, conflict, notFound } = require('../utils/httpError');

const toMonthlyBudget = (budget) =>
  budget && {
    _id: budget._id,
    month_year: budget.month_year,
    total_budget_amount: budget.total_budget_amount,
    start_date: budget.start_date,
    end_date: budget.end_date,
  };

function assertValidRange(start, end) {
  if (end < start) throw badRequest('The end date must be on or after the start date.', { end_date: 'Before start' });
}

async function assertMonthAvailable(userId, monthYear, excludeId) {
  const filter = { user_id: userId, month_year: monthYear };
  if (excludeId) filter._id = { $ne: excludeId };
  if (await MonthlyBudget.exists(filter)) throw conflict(`You already have a monthly budget for ${monthYear}.`);
}

async function findOwnBudget(userId, id) {
  v.assertObjectId(id, 'budget id');
  const budget = await MonthlyBudget.findOne({ _id: id, user_id: userId });
  if (!budget) throw notFound('Monthly budget not found.');
  return budget;
}

// GET /api/monthly-budgets
async function listMonthlyBudgets(req, res) {
  const budgets = await MonthlyBudget.find({ user_id: req.user.userId }).sort({ start_date: -1 });
  res.json(budgets.map(toMonthlyBudget));
}

// GET /api/monthly-budgets/current
async function getCurrentMonthlyBudget(req, res) {
  const budget = await findCurrentMonthlyBudget(req.user.userId);
  res.json(toMonthlyBudget(budget) || null);
}

// POST /api/monthly-budgets
async function createMonthlyBudget(req, res) {
  const total = v.amount(req.body.total_budget_amount, 'total_budget_amount', { min: 0 });
  const start = v.date(req.body.start_date, 'start_date');
  const end = v.date(req.body.end_date, 'end_date');
  assertValidRange(start, end);

  const monthYear = toMonthYear(start);
  await assertMonthAvailable(req.user.userId, monthYear);

  const budget = await MonthlyBudget.create({
    user_id: req.user.userId,
    month_year: monthYear,
    total_budget_amount: total,
    start_date: start,
    end_date: end,
  });
  res.status(201).json(toMonthlyBudget(budget));
}

// PUT /api/monthly-budgets/:id
async function updateMonthlyBudget(req, res) {
  const budget = await findOwnBudget(req.user.userId, req.params.id);
  const { body } = req;

  if (body.total_budget_amount !== undefined) {
    budget.total_budget_amount = v.amount(body.total_budget_amount, 'total_budget_amount', { min: 0 });
  }
  if (body.start_date !== undefined) budget.start_date = v.date(body.start_date, 'start_date');
  if (body.end_date !== undefined) budget.end_date = v.date(body.end_date, 'end_date');
  assertValidRange(budget.start_date, budget.end_date);

  const monthYear = toMonthYear(budget.start_date);
  if (monthYear !== budget.month_year) {
    await assertMonthAvailable(req.user.userId, monthYear, budget._id);
    budget.month_year = monthYear;
  }

  await budget.save();
  res.json(toMonthlyBudget(budget));
}

// DELETE /api/monthly-budgets/:id
async function deleteMonthlyBudget(req, res) {
  const budget = await findOwnBudget(req.user.userId, req.params.id);
  await budget.deleteOne();
  res.json({ message: 'Monthly budget deleted.' });
}

module.exports = {
  listMonthlyBudgets,
  getCurrentMonthlyBudget,
  createMonthlyBudget,
  updateMonthlyBudget,
  deleteMonthlyBudget,
};
