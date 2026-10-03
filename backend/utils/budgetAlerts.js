const mongoose = require('mongoose');
const Budget = require('../models/Budget');
const Expense = require('../models/Expense');
const FamilyBudget = require('../models/FamilyBudget');
const FamilyExpense = require('../models/FamilyExpense');
const FamilyMember = require('../models/FamilyMember');
const { notify, notifyMany } = require('./notify');
const { getPeriodForDate } = require('./period');

const APPROACHING_RATIO = 0.8;

/** Returns 'exceeded' / 'approaching' when spending first crosses a threshold, otherwise null. */
function crossedThreshold(before, after, limit) {
  if (!limit || limit <= 0 || after <= before) return null;
  if (before <= limit && after > limit) return 'exceeded';
  const warnAt = limit * APPROACHING_RATIO;
  if (before < warnAt && after >= warnAt) return 'approaching';
  return null;
}

const percent = (spent, limit) => Math.round((spent / limit) * 100);

const monthLabel = (monthYear) =>
  new Date(`${monthYear}-01T00:00:00Z`).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });

async function sumAmount(Model, match) {
  const [result] = await Model.aggregate([{ $match: match }, { $group: { _id: null, total: { $sum: '$amount' } } }]);
  return result ? result.total : 0;
}

/**
 * Notifies the user when an expense change pushes a category past 80% or 100% of its limit for
 * the budgeting period containing the expense. `delta` is how much the change added to that
 * category's spending.
 */
async function checkPersonalBudget({ userId, categoryId, expenseDate, delta }) {
  if (!(delta > 0)) return;
  try {
    const { start, endExclusive, monthYear } = await getPeriodForDate(userId, expenseDate);
    const budget = await Budget.findOne({ user_id: userId, category_id: categoryId, month_year: monthYear }).populate(
      'category_id',
      'name'
    );
    if (!budget || !budget.limit_amount) return;

    const after = await sumAmount(Expense, {
      user_id: new mongoose.Types.ObjectId(String(userId)),
      category_id: new mongoose.Types.ObjectId(String(categoryId)),
      expense_date: { $gte: start, $lt: endExclusive },
    });
    const level = crossedThreshold(after - delta, after, budget.limit_amount);
    if (!level) return;

    const name = budget.category_id?.name || 'a category';
    const usage = percent(after, budget.limit_amount);
    await notify({
      recipient: userId,
      type: level === 'exceeded' ? 'budget_limit_exceeded' : 'budget_limit_approaching',
      message:
        level === 'exceeded'
          ? `You've gone over your ${name} budget for ${monthLabel(monthYear)} (${usage}% used).`
          : `Heads up: you've used ${usage}% of your ${name} budget for ${monthLabel(monthYear)}.`,
      related: { id: budget._id, model_type: 'Budget' },
      link: '/budget-management',
    });
  } catch (error) {
    console.error('Budget alert check failed:', error.message);
  }
}

/**
 * Notifies plan admins when approved spending in a category first crosses 80% or 100% of
 * the plan's limit for that category.
 */
async function checkFamilyBudget({ plan, categoryId, delta }) {
  if (!(delta > 0)) return;
  try {
    const limit = await FamilyBudget.findOne({ plan_id: plan._id, category_id: categoryId }).populate(
      'category_id',
      'name'
    );
    if (!limit || !limit.limit_amount) return;

    // Matches the plan totals shown in the app: every approved expense in the category.
    const after = await sumAmount(FamilyExpense, {
      plan_id: plan._id,
      category_id: new mongoose.Types.ObjectId(String(categoryId)),
      status: 'approved',
    });
    const level = crossedThreshold(after - delta, after, limit.limit_amount);
    if (!level) return;

    const admins = await FamilyMember.find({ plan_id: plan._id, role: 'admin' }).select('user_id').lean();
    const name = limit.category_id?.name || 'a category';
    const usage = percent(after, limit.limit_amount);
    await notifyMany(
      admins.map((member) => member.user_id),
      {
        type: level === 'exceeded' ? 'budget_limit_exceeded' : 'budget_limit_approaching',
        message:
          level === 'exceeded'
            ? `"${plan.plan_name}" has gone over its ${name} limit (${usage}% used).`
            : `"${plan.plan_name}" has used ${usage}% of its ${name} limit.`,
        related: { id: plan._id, model_type: 'FamilyPlan' },
        link: `/shared-budgeting?plan=${plan._id}`,
      }
    );
  } catch (error) {
    console.error('Family budget alert check failed:', error.message);
  }
}

module.exports = { crossedThreshold, checkPersonalBudget, checkFamilyBudget };
