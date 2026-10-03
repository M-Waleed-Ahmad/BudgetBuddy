const Category = require('../models/Category');
const FamilyExpense = require('../models/FamilyExpense');
const FamilyMember = require('../models/FamilyMember');
const User = require('../models/User');
const v = require('../utils/validation');
const { badRequest, forbidden, notFound } = require('../utils/httpError');
const { formatMoney } = require('../utils/money');
const { notify, notifyMany } = require('../utils/notify');
const { checkFamilyBudget } = require('../utils/budgetAlerts');
const { planOwnerId } = require('../middleware/planAccess');

const POPULATE = [
  { path: 'category_id', select: 'name' },
  { path: 'added_by_user_id', select: 'name' },
  { path: 'approved_by_user_id', select: 'name' },
];

const ref = (doc) => (doc?._id ? { _id: doc._id, name: doc.name } : null);

const toFamilyExpense = (expense) => ({
  _id: expense._id,
  plan_id: expense.plan_id,
  amount: expense.amount,
  description: expense.description,
  notes: expense.notes || '',
  expense_date: expense.expense_date,
  status: expense.status,
  category: ref(expense.category_id),
  added_by: ref(expense.added_by_user_id),
  approved_by: ref(expense.approved_by_user_id),
  created_at: expense.created_at,
});

const planLink = (plan) => `/shared-budgeting?plan=${plan._id}`;

async function planCategory(plan, categoryId) {
  if (!categoryId) throw badRequest('Please choose a category.', { category_id: 'Required' });
  v.assertObjectId(String(categoryId), 'category id');
  const category = await Category.findOne({ _id: categoryId, user_id: planOwnerId(plan) }).select('name');
  if (!category) throw badRequest("Choose one of the plan's categories.", { category_id: 'Not a plan category' });
  return category;
}

async function findPlanExpense(plan, expenseId) {
  v.assertObjectId(expenseId, 'expense id');
  const expense = await FamilyExpense.findOne({ _id: expenseId, plan_id: plan._id });
  if (!expense) throw notFound('Expense not found.');
  return expense;
}

/** Admins can change any expense; editors only their own. */
function assertCanModify(membership, expense) {
  if (membership.role === 'admin') return;
  if (String(expense.added_by_user_id) !== String(membership.user_id)) {
    throw forbidden('Editors can only change expenses they added.');
  }
}

async function adminIds(plan) {
  const admins = await FamilyMember.find({ plan_id: plan._id, role: 'admin' }).select('user_id').lean();
  return admins.map((admin) => admin.user_id);
}

async function describeExpense(plan, expense, actorId) {
  const [actor, category] = await Promise.all([
    User.findById(actorId).select('name').lean(),
    Category.findById(expense.category_id).select('name').lean(),
  ]);
  return {
    actorName: actor?.name || 'Someone',
    summary: `${formatMoney(expense.amount, plan.currency)} for ${category?.name || 'a category'} ("${expense.description}")`,
  };
}

async function respond(res, expense, status = 200) {
  await expense.populate(POPULATE);
  res.status(status).json(toFamilyExpense(expense));
}

// GET /api/family-plans/:planId/expenses?mine=true
async function listExpenses(req, res) {
  const filter = { plan_id: req.plan._id };
  if (req.query.mine === 'true') filter.added_by_user_id = req.user.userId;
  const expenses = await FamilyExpense.find(filter).populate(POPULATE).sort({ expense_date: -1, created_at: -1 });
  res.json(expenses.map(toFamilyExpense));
}

// POST /api/family-plans/:planId/expenses (admin, editor)
async function createExpense(req, res) {
  const { plan, membership } = req;
  const category = await planCategory(plan, req.body.category_id);
  const needsApproval = plan.require_approval && membership.role !== 'admin';

  const expense = await FamilyExpense.create({
    plan_id: plan._id,
    added_by_user_id: req.user.userId,
    category_id: category._id,
    amount: v.amount(req.body.amount),
    description: v.string(req.body.description, 'description', { required: true, max: 200 }),
    notes: v.string(req.body.notes, 'notes', { max: 1000 }) || '',
    expense_date: v.date(req.body.expense_date, 'expense_date'),
    status: needsApproval ? 'pending' : 'approved',
  });

  const { actorName, summary } = await describeExpense(plan, expense, req.user.userId);
  await notifyMany(await adminIds(plan), {
    type: needsApproval ? 'expense_needs_approval' : 'expense_added',
    message: needsApproval
      ? `${actorName} added ${summary} to "${plan.plan_name}". It needs your approval.`
      : `${actorName} added ${summary} to "${plan.plan_name}".`,
    actor: req.user.userId,
    related: { id: expense._id, model_type: 'FamilyExpense' },
    link: planLink(plan),
  });
  if (!needsApproval) await checkFamilyBudget({ plan, categoryId: category._id, delta: expense.amount });

  await respond(res, expense, 201);
}

// PUT /api/family-plans/:planId/expenses/:expenseId (admin, or the editor who added it)
async function updateExpense(req, res) {
  const { plan, membership, body } = req;
  const expense = await findPlanExpense(plan, req.params.expenseId);
  assertCanModify(membership, expense);

  const before = { status: expense.status, categoryId: String(expense.category_id), amount: expense.amount };

  if (body.category_id !== undefined) expense.category_id = (await planCategory(plan, body.category_id))._id;
  if (body.amount !== undefined) expense.amount = v.amount(body.amount);
  if (body.description !== undefined) {
    expense.description = v.string(body.description, 'description', { required: true, max: 200 });
  }
  if (body.notes !== undefined) expense.notes = v.string(body.notes, 'notes', { max: 1000 }) || '';
  if (body.expense_date !== undefined) expense.expense_date = v.date(body.expense_date, 'expense_date');

  // Edits by non-admins go back through approval when the plan requires it. Editing a rejected
  // expense otherwise resubmits it (an admin's edit counts as their approval).
  if (plan.require_approval && membership.role !== 'admin') {
    expense.status = 'pending';
    expense.approved_by_user_id = null;
  } else if (before.status === 'rejected') {
    expense.status = 'approved';
    expense.approved_by_user_id = membership.role === 'admin' ? req.user.userId : null;
  }
  await expense.save();

  if (expense.status === 'pending' && before.status !== 'pending') {
    const { actorName, summary } = await describeExpense(plan, expense, req.user.userId);
    await notifyMany(await adminIds(plan), {
      type: 'expense_needs_approval',
      message: `${actorName} edited ${summary} in "${plan.plan_name}". It needs your approval.`,
      actor: req.user.userId,
      related: { id: expense._id, model_type: 'FamilyExpense' },
      link: planLink(plan),
    });
  }
  if (expense.status === 'approved') {
    const sameBucket = before.status === 'approved' && before.categoryId === String(expense.category_id);
    await checkFamilyBudget({
      plan,
      categoryId: expense.category_id,
      delta: sameBucket ? expense.amount - before.amount : expense.amount,
    });
  }

  await respond(res, expense);
}

// DELETE /api/family-plans/:planId/expenses/:expenseId (admin, or the editor who added it)
async function deleteExpense(req, res) {
  const expense = await findPlanExpense(req.plan, req.params.expenseId);
  assertCanModify(req.membership, expense);
  await expense.deleteOne();
  res.json({ message: 'Expense deleted.' });
}

async function review(req, res, decision) {
  const { plan } = req;
  const expense = await findPlanExpense(plan, req.params.expenseId);
  if (expense.status !== 'pending') throw badRequest(`This expense is already ${expense.status}.`);

  expense.status = decision;
  expense.approved_by_user_id = req.user.userId;
  await expense.save();

  const { actorName, summary } = await describeExpense(plan, expense, req.user.userId);
  await notify({
    recipient: String(expense.added_by_user_id) === req.user.userId ? null : expense.added_by_user_id,
    type: decision === 'approved' ? 'expense_approved' : 'expense_rejected',
    message: `${actorName} ${decision} your expense of ${summary} in "${plan.plan_name}".`,
    actor: req.user.userId,
    related: { id: expense._id, model_type: 'FamilyExpense' },
    link: planLink(plan),
  });
  if (decision === 'approved') await checkFamilyBudget({ plan, categoryId: expense.category_id, delta: expense.amount });

  await respond(res, expense);
}

// POST /api/family-plans/:planId/expenses/:expenseId/approve (admin)
const approveExpense = (req, res) => review(req, res, 'approved');

// POST /api/family-plans/:planId/expenses/:expenseId/reject (admin)
const rejectExpense = (req, res) => review(req, res, 'rejected');

module.exports = { listExpenses, createExpense, updateExpense, deleteExpense, approveExpense, rejectExpense };
