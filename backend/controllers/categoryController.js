const Category = require('../models/Category');
const Budget = require('../models/Budget');
const Expense = require('../models/Expense');
const FamilyBudget = require('../models/FamilyBudget');
const FamilyExpense = require('../models/FamilyExpense');
const v = require('../utils/validation');
const { badRequest, conflict, notFound } = require('../utils/httpError');

const CASE_INSENSITIVE = { locale: 'en', strength: 2 };

const toCategory = (category) => ({ _id: category._id, name: category.name });

async function findOwnCategory(userId, id) {
  if (!id) throw badRequest('Please choose a category.', { category_id: 'Required' });
  v.assertObjectId(String(id), 'category id');
  const category = await Category.findOne({ _id: id, user_id: userId });
  if (!category) throw notFound('Category not found.');
  return category;
}

async function assertNameAvailable(userId, name, excludeId) {
  const filter = { user_id: userId, name };
  if (excludeId) filter._id = { $ne: excludeId };
  const existing = await Category.findOne(filter).collation(CASE_INSENSITIVE);
  if (existing) throw conflict(`You already have a category named "${existing.name}".`);
}

// GET /api/categories
async function listCategories(req, res) {
  const categories = await Category.find({ user_id: req.user.userId }).collation(CASE_INSENSITIVE).sort({ name: 1 });
  res.json(categories.map(toCategory));
}

// POST /api/categories
async function createCategory(req, res) {
  const name = v.string(req.body.name, 'name', { required: true, max: 50 });
  await assertNameAvailable(req.user.userId, name);
  const category = await Category.create({ name, user_id: req.user.userId });
  res.status(201).json(toCategory(category));
}

// PUT /api/categories/:id
async function updateCategory(req, res) {
  const category = await findOwnCategory(req.user.userId, req.params.id);
  const name = v.string(req.body.name, 'name', { required: true, max: 50 });
  await assertNameAvailable(req.user.userId, name, category._id);
  category.name = name;
  await category.save();
  res.json(toCategory(category));
}

// DELETE /api/categories/:id
async function deleteCategory(req, res) {
  const category = await findOwnCategory(req.user.userId, req.params.id);

  const [expenses, budgets, familyBudgets, familyExpenses] = await Promise.all([
    Expense.countDocuments({ category_id: category._id }),
    Budget.countDocuments({ category_id: category._id }),
    FamilyBudget.countDocuments({ category_id: category._id }),
    FamilyExpense.countDocuments({ category_id: category._id }),
  ]);

  const usages = [
    [expenses, 'expense'],
    [budgets, 'budget limit'],
    [familyBudgets, 'family plan limit'],
    [familyExpenses, 'family expense'],
  ]
    .filter(([count]) => count > 0)
    .map(([count, label]) => `${count} ${label}${count === 1 ? '' : 's'}`);

  if (usages.length) {
    throw conflict(`"${category.name}" is used by ${usages.join(', ')}. Reassign or delete those first.`);
  }

  await category.deleteOne();
  res.json({ message: `Category "${category.name}" deleted.` });
}

module.exports = { listCategories, createCategory, updateCategory, deleteCategory, findOwnCategory };
