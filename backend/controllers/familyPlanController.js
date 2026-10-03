const Category = require('../models/Category');
const FamilyBudget = require('../models/FamilyBudget');
const FamilyExpense = require('../models/FamilyExpense');
const FamilyMember = require('../models/FamilyMember');
const FamilyPlan = require('../models/FamilyPlan');
const Invite = require('../models/Invite');
const User = require('../models/User');
const v = require('../utils/validation');
const { badRequest, forbidden } = require('../utils/httpError');
const { formatMoney } = require('../utils/money');
const { notifyMany } = require('../utils/notify');
const { isPlanOwner, planOwnerId } = require('../middleware/planAccess');

const CASE_INSENSITIVE = { locale: 'en', strength: 2 };

async function buildPlanDetails(plan, userRole) {
  await plan.populate('owner_user_id', 'name email');
  const limits = await FamilyBudget.find({ plan_id: plan._id }).populate('category_id', 'name').lean();
  const owner = plan.owner_user_id;

  return {
    _id: plan._id,
    plan_name: plan.plan_name,
    currency: plan.currency,
    total_budget_amount: plan.total_budget_amount,
    start_date: plan.start_date,
    end_date: plan.end_date,
    require_approval: plan.require_approval,
    owner: owner?._id ? { _id: owner._id, name: owner.name, email: owner.email } : null,
    userRole,
    categoryBudgets: limits
      .filter((limit) => limit.category_id)
      .map((limit) => ({
        categoryId: limit.category_id._id,
        categoryName: limit.category_id.name,
        limitAmount: limit.limit_amount,
      }))
      .sort((a, b) => a.categoryName.localeCompare(b.categoryName)),
    created_at: plan.created_at,
  };
}

/** Validates plan fields from a request body. On create, `plan_name` is required. */
function parsePlanFields(body, { creating = false } = {}) {
  const fields = {};
  if (creating || body.plan_name !== undefined) {
    fields.plan_name = v.string(body.plan_name, 'plan_name', { required: true, max: 100 });
  }
  if (body.total_budget_amount !== undefined) {
    fields.total_budget_amount =
      body.total_budget_amount === null || body.total_budget_amount === ''
        ? null
        : v.amount(body.total_budget_amount, 'total_budget_amount', { min: 0 });
  }
  if (body.start_date !== undefined) fields.start_date = v.date(body.start_date, 'start_date', { required: false }) || null;
  if (body.end_date !== undefined) fields.end_date = v.date(body.end_date, 'end_date', { required: false }) || null;
  const currency = v.currency(body.currency);
  if (currency) fields.currency = currency;
  if (body.require_approval !== undefined) fields.require_approval = v.boolean(body.require_approval, 'require_approval');
  return fields;
}

function assertValidDates(plan) {
  if (plan.start_date && plan.end_date && plan.end_date < plan.start_date) {
    throw badRequest('The end date must be on or after the start date.', { end_date: 'Before start' });
  }
}

/** Parses `categoryBudgets` into a Map of categoryId -> limit, checking the categories belong to the owner. */
async function parseCategoryBudgets(plan, entries) {
  if (!Array.isArray(entries)) throw badRequest('categoryBudgets must be a list.');
  const updates = new Map();
  entries.forEach((entry) => {
    const categoryId = v.assertObjectId(String(entry?.category_id ?? ''), 'category id');
    updates.set(categoryId, v.amount(entry.limit_amount ?? 0, 'limit_amount', { min: 0 }));
  });
  if (updates.size) {
    const owned = await Category.countDocuments({ _id: { $in: [...updates.keys()] }, user_id: planOwnerId(plan) });
    if (owned !== updates.size) throw badRequest("Category limits must use the plan owner's categories.");
  }
  return updates;
}

// GET /api/family-plans
async function listPlans(req, res) {
  const memberships = await FamilyMember.find({ user_id: req.user.userId })
    .populate('plan_id', 'plan_name currency owner_user_id')
    .lean();

  const plans = memberships
    .filter((membership) => membership.plan_id)
    .map((membership) => ({
      _id: membership.plan_id._id,
      plan_name: membership.plan_id.plan_name,
      currency: membership.plan_id.currency,
      owner_user_id: membership.plan_id.owner_user_id,
      userRole: membership.role,
    }))
    .sort((a, b) => a.plan_name.localeCompare(b.plan_name));
  res.json(plans);
}

// POST /api/family-plans
async function createPlan(req, res) {
  const fields = parsePlanFields(req.body, { creating: true });
  if (!fields.currency) {
    const user = await User.findById(req.user.userId).select('currency_preference').lean();
    fields.currency = user?.currency_preference || 'USD';
  }

  const plan = new FamilyPlan({ ...fields, owner_user_id: req.user.userId });
  assertValidDates(plan);
  await plan.save();

  try {
    await FamilyMember.create({ plan_id: plan._id, user_id: req.user.userId, role: 'admin' });
  } catch (error) {
    await plan.deleteOne();
    throw error;
  }

  res.status(201).json(await buildPlanDetails(plan, 'admin'));
}

// GET /api/family-plans/:planId
async function getPlan(req, res) {
  res.json(await buildPlanDetails(req.plan, req.membership.role));
}

// PUT /api/family-plans/:planId (admin)
async function updatePlan(req, res) {
  const { plan } = req;
  const fields = parsePlanFields(req.body);
  const limitUpdates =
    req.body.categoryBudgets !== undefined ? await parseCategoryBudgets(plan, req.body.categoryBudgets) : null;

  if (!Object.keys(fields).length && !limitUpdates) throw badRequest('Nothing to update.');

  Object.assign(plan, fields);
  assertValidDates(plan);

  // The category limits that would be in place after this update must fit within the plan total.
  const existing = await FamilyBudget.find({ plan_id: plan._id }).lean();
  const limits = new Map(existing.map((limit) => [String(limit.category_id), limit.limit_amount]));
  limitUpdates?.forEach((amount, categoryId) => {
    if (amount > 0) limits.set(categoryId, amount);
    else limits.delete(categoryId);
  });
  const allocated = [...limits.values()].reduce((sum, amount) => sum + amount, 0);
  // A missing or zero total means the plan has no overall cap.
  if (plan.total_budget_amount > 0 && allocated > plan.total_budget_amount) {
    throw badRequest(
      `Category limits add up to ${formatMoney(allocated, plan.currency)}, which is more than the plan total of ${formatMoney(plan.total_budget_amount, plan.currency)}.`
    );
  }

  await plan.save();
  if (limitUpdates) {
    await Promise.all(
      [...limitUpdates].map(([categoryId, amount]) =>
        amount > 0
          ? FamilyBudget.updateOne(
              { plan_id: plan._id, category_id: categoryId },
              { $set: { limit_amount: amount, updated_at: new Date() } },
              { upsert: true }
            )
          : FamilyBudget.deleteOne({ plan_id: plan._id, category_id: categoryId })
      )
    );
  }

  res.json(await buildPlanDetails(plan, req.membership.role));
}

// DELETE /api/family-plans/:planId (owner)
async function deletePlan(req, res) {
  const { plan } = req;
  if (!isPlanOwner(plan, req.user.userId)) throw forbidden('Only the plan owner can delete this plan.');

  const members = await FamilyMember.find({ plan_id: plan._id }).select('user_id').lean();
  await Promise.all([
    FamilyExpense.deleteMany({ plan_id: plan._id }),
    FamilyBudget.deleteMany({ plan_id: plan._id }),
    Invite.deleteMany({ plan_id: plan._id }),
    FamilyMember.deleteMany({ plan_id: plan._id }),
  ]);
  await plan.deleteOne();

  await notifyMany(
    members.map((member) => member.user_id),
    {
      type: 'generic_message',
      message: `The family plan "${plan.plan_name}" was deleted by its owner.`,
      actor: req.user.userId,
      link: '/shared-budgeting',
    }
  );

  res.json({ message: `Plan "${plan.plan_name}" deleted.` });
}

// GET /api/family-plans/:planId/categories
async function listPlanCategories(req, res) {
  const { plan } = req;
  const [categories, limits] = await Promise.all([
    Category.find({ user_id: planOwnerId(plan) }).collation(CASE_INSENSITIVE).sort({ name: 1 }).lean(),
    FamilyBudget.find({ plan_id: plan._id }).lean(),
  ]);
  const limitByCategory = new Map(limits.map((limit) => [String(limit.category_id), limit.limit_amount]));
  res.json(
    categories.map((category) => ({
      _id: category._id,
      name: category.name,
      limitAmount: limitByCategory.get(String(category._id)) || 0,
    }))
  );
}

module.exports = { listPlans, createPlan, getPlan, updatePlan, deletePlan, listPlanCategories };
