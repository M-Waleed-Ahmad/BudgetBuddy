/** Returns the id of a value that may be either a populated document or a raw id. */
export function idOf(value) {
  if (!value) return null;
  return String(typeof value === 'object' ? value._id : value);
}

export const ROLE_OPTIONS = [
  { value: 'viewer', label: 'Viewer', description: 'Can see the plan, its members and expenses.' },
  { value: 'editor', label: 'Editor', description: 'Can also add expenses and edit or delete their own.' },
  { value: 'admin', label: 'Admin', description: 'Full access: settings, members, approvals and all expenses.' },
];

export const roleLabel = (role) => ROLE_OPTIONS.find((option) => option.value === role)?.label || 'Viewer';

/**
 * Derives what the current user may do in a plan, following the API contract:
 * viewers are read-only, editors add expenses and manage their own, admins manage
 * everything, and only the owner can delete the plan.
 *
 * @param {object|null} details  PlanDetails (preferred, once loaded)
 * @param {object|null} summary  PlanSummary from the plans list (available immediately)
 * @param {string|undefined} userId
 */
export function getPlanPermissions(details, summary, userId) {
  const role = details?.userRole || summary?.userRole || 'viewer';
  const ownerId = idOf(details?.owner) || idOf(summary?.owner_user_id);
  const me = userId ? String(userId) : null;
  const isOwner = Boolean(me && ownerId === me);
  const isAdmin = role === 'admin';
  const isEditor = role === 'editor';

  return {
    role,
    isOwner,
    isAdmin,
    canAddExpense: isAdmin || isEditor,
    canManagePlan: isAdmin,
    canDeletePlan: isOwner,
    canLeavePlan: Boolean(me) && !isOwner,
    canEditExpense: (expense) => isAdmin || (isEditor && Boolean(me) && idOf(expense?.added_by) === me),
    canReviewExpense: (expense) => isAdmin && expense?.status === 'pending',
    canManageMember: (member) => isAdmin && !member?.isOwner && idOf(member?.user) !== me,
  };
}
