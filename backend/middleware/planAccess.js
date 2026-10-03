const FamilyPlan = require('../models/FamilyPlan');
const FamilyMember = require('../models/FamilyMember');
const { assertObjectId } = require('../utils/validation');
const { forbidden, notFound } = require('../utils/httpError');

const ALL_ROLES = ['admin', 'editor', 'viewer'];

/**
 * Loads `req.params.planId` and the caller's membership, enforcing one of `roles`.
 * Non-members get 404 so plan ids can't be probed. Sets `req.plan` and `req.membership`.
 */
const requirePlanRole = (roles = ALL_ROLES) => async (req, res, next) => {
  const planId = assertObjectId(req.params.planId, 'plan id');
  const [plan, membership] = await Promise.all([
    FamilyPlan.findById(planId),
    FamilyMember.findOne({ plan_id: planId, user_id: req.user.userId }),
  ]);
  if (!plan || !membership) throw notFound('Plan not found.');
  if (!roles.includes(membership.role)) {
    throw forbidden(`This action requires the ${roles.join(' or ')} role in this plan.`);
  }
  req.plan = plan;
  req.membership = membership;
  next();
};

/** Works whether or not `owner_user_id` has been populated. */
const planOwnerId = (plan) => String(plan.owner_user_id?._id ?? plan.owner_user_id);
const isPlanOwner = (plan, userId) => planOwnerId(plan) === String(userId);

module.exports = { requirePlanRole, isPlanOwner, planOwnerId, ALL_ROLES };
