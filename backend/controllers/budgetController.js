const Budget = require('../models/Budget');
const v = require('../utils/validation');
const { conflict, notFound } = require('../utils/httpError');
const { findOwnCategory } = require('./categoryController');

const toBudget = (budget) => ({
  _id: budget._id,
  category_id: budget.category_id ? budget.category_id._id : null,
  category_name: budget.category_id ? budget.category_id.name : 'Uncategorized',
  month_year: budget.month_year,
  limit_amount: budget.limit_amount,
  description: budget.description || '',
});

async function assertNoDuplicate(userId, categoryId, monthYear, excludeId) {
  const filter = { user_id: userId, category_id: categoryId, month_year: monthYear };
  if (excludeId) filter._id = { $ne: excludeId };
  if (await Budget.exists(filter)) throw conflict('This category already has a budget for that month.');
}

async function findOwnBudget(userId, id) {
  v.assertObjectId(id, 'budget id');
  const budget = await Budget.findOne({ _id: id, user_id: userId });
  if (!budget) throw notFound('Budget not found.');
  return budget;
}

// GET /api/budgets?monthYear=YYYY-MM
async function listBudgets(req, res) {
  const monthYear = v.monthYear(req.query.monthYear, 'monthYear');
  const budgets = await Budget.find({ user_id: req.user.userId, month_year: monthYear })
    .populate('category_id', 'name')
    .sort({ created_at: 1 });
  res.json(budgets.map(toBudget));
}

// POST /api/budgets
async function createBudget(req, res) {
  const category = await findOwnCategory(req.user.userId, req.body.category_id);
  const monthYear = v.monthYear(req.body.month_year);
  const limit = v.amount(req.body.limit_amount, 'limit_amount', { min: 0 });
  const description = v.string(req.body.description, 'description', { max: 200 });

  await assertNoDuplicate(req.user.userId, category._id, monthYear);

  const budget = await Budget.create({
    user_id: req.user.userId,
    category_id: category._id,
    month_year: monthYear,
    limit_amount: limit,
    description,
  });
  await budget.populate('category_id', 'name');
  res.status(201).json(toBudget(budget));
}

// PUT /api/budgets/:id
async function updateBudget(req, res) {
  const budget = await findOwnBudget(req.user.userId, req.params.id);
  const { body } = req;

  if (body.category_id !== undefined && String(body.category_id) !== String(budget.category_id)) {
    const category = await findOwnCategory(req.user.userId, body.category_id);
    await assertNoDuplicate(req.user.userId, category._id, budget.month_year, budget._id);
    budget.category_id = category._id;
  }
  if (body.limit_amount !== undefined) budget.limit_amount = v.amount(body.limit_amount, 'limit_amount', { min: 0 });
  if (body.description !== undefined) budget.description = v.string(body.description, 'description', { max: 200 });

  await budget.save();
  await budget.populate('category_id', 'name');
  res.json(toBudget(budget));
}

// DELETE /api/budgets/:id
async function deleteBudget(req, res) {
  const budget = await findOwnBudget(req.user.userId, req.params.id);
  await budget.deleteOne();
  res.json({ message: 'Budget deleted.' });
}

module.exports = { listBudgets, createBudget, updateBudget, deleteBudget };
