import { useCallback, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { FiPlus } from 'react-icons/fi';
import AppLayout from '../../components/AppLayout';
import {
  approveFamilyExpense,
  deleteFamilyExpense,
  deleteFamilyPlan,
  rejectFamilyExpense,
  removeMember,
  updateMemberRole,
} from '../../api';
import { useAuth } from '../../context/AuthContext';
import ConfirmDialog from '../../components/ConfirmDialog';
import ExpenseFormModal from './family/ExpenseFormModal';
import ExpensesSection from './family/ExpensesSection';
import InviteMemberModal from './family/InviteMemberModal';
import MembersPanel from './family/MembersPanel';
import PendingInvitations from './family/PendingInvitations';
import PlanFormModal from './family/PlanFormModal';
import PlanOverview from './family/PlanOverview';
import PlanSelector from './family/PlanSelector';
import PlanSettingsModal from './family/PlanSettingsModal';
import SentInvitations from './family/SentInvitations';
import { getPlanPermissions, roleLabel } from './family/permissions';
import { EmptyState, ErrorState, LoadingState } from './family/SectionStatus';
import { EXPENSE_SECTIONS, usePlanData } from './family/usePlanData';
import '../../styles/FamilyBudgetingPage.css';

const FamilyBudgetingPage = () => {
  const { user, currency: userCurrency } = useAuth();
  const {
    plans,
    plansLoading,
    plansLoaded,
    plansError,
    reloadPlans,
    selectedPlanId,
    selectedSummary,
    selectPlan,
    forgetPlan,
    applyDetails,
    reload,
    details,
    members,
    categories,
    expenses,
    myExpenses,
  } = usePlanData();

  // One modal at a time. `key` changes on every open so each form starts fresh.
  const [modal, setModal] = useState({ type: null, data: null, key: 0 });
  const openModal = useCallback((type, data = null) => setModal((prev) => ({ type, data, key: prev.key + 1 })), []);
  const closeModal = useCallback(() => setModal((prev) => ({ ...prev, type: null })), []);
  // Bumped after an invitation is sent so the sent-invitations list reloads.
  const [invitesVersion, setInvitesVersion] = useState(0);

  const plan = details.data;
  const permissions = useMemo(
    () => getPlanPermissions(plan, selectedSummary, user?._id),
    [plan, selectedSummary, user?._id]
  );
  const refreshing = [details, members, categories, expenses, myExpenses].some((section) => section.loading);

  const askConfirm = (options) => openModal('confirm', options);

  // --- Plans ---

  const handlePlanJoinedOrCreated = async (planId) => {
    await reloadPlans();
    if (planId) selectPlan(planId);
  };

  const handleSettingsSaved = async (updated) => {
    applyDetails(updated);
    await reload(['categories']);
  };

  const askDeletePlan = () => {
    const planId = selectedPlanId;
    askConfirm({
      title: 'Delete plan',
      message: `Delete "${plan.plan_name}" for everyone? All of its members, invitations and expenses will be removed. This can't be undone.`,
      confirmLabel: 'Delete plan',
      onConfirm: async () => {
        await deleteFamilyPlan(planId);
        toast.success('Plan deleted.');
        closeModal();
        await forgetPlan(planId);
      },
    });
  };

  const askLeavePlan = () => {
    const planId = selectedPlanId;
    askConfirm({
      title: 'Leave plan',
      message: `Leave "${plan.plan_name}"? You'll lose access to it until an admin invites you again.`,
      confirmLabel: 'Leave plan',
      onConfirm: async () => {
        await removeMember(planId, user._id);
        toast.success(`You left "${plan.plan_name}".`);
        closeModal();
        await forgetPlan(planId);
      },
    });
  };

  // --- Expenses ---

  const reloadExpenses = () => reload(EXPENSE_SECTIONS);

  const handleReview = async (expense, action) => {
    try {
      if (action === 'approve') await approveFamilyExpense(selectedPlanId, expense._id);
      else await rejectFamilyExpense(selectedPlanId, expense._id);
      toast.success(action === 'approve' ? 'Expense approved.' : 'Expense rejected.');
      await reloadExpenses();
    } catch (err) {
      toast.error(err.message || 'Could not update the expense.');
    }
  };

  const askDeleteExpense = (expense) => {
    const planId = selectedPlanId;
    askConfirm({
      title: 'Delete expense',
      message: `Delete "${expense.description || 'this expense'}"? This can't be undone.`,
      confirmLabel: 'Delete expense',
      onConfirm: async () => {
        await deleteFamilyExpense(planId, expense._id);
        toast.success('Expense deleted.');
        closeModal();
        await reloadExpenses();
      },
    });
  };

  // --- Members ---

  const handleRoleChange = async (member, role) => {
    try {
      await updateMemberRole(selectedPlanId, member.user._id, role);
      toast.success(`${member.user?.name || 'Member'} is now ${roleLabel(role).toLowerCase()}.`);
      await reload(['members']);
    } catch (err) {
      toast.error(err.message || 'Could not change the role.');
    }
  };

  const askRemoveMember = (member) => {
    const planId = selectedPlanId;
    const name = member.user?.name || 'this member';
    askConfirm({
      title: 'Remove member',
      message: `Remove ${name} from "${plan.plan_name}"? Their existing expenses stay in the plan.`,
      confirmLabel: 'Remove member',
      onConfirm: async () => {
        await removeMember(planId, member.user._id);
        toast.success(`${name} was removed.`);
        closeModal();
        await reload(['members']);
      },
    });
  };

  // --- Render ---

  let content = null;
  if (!plansLoaded && plansLoading) {
    content = <LoadingState label="Loading your plans…" />;
  } else if (plansLoaded && plans.length === 0 && !plansError) {
    content = (
      <section className="family-card">
        <EmptyState
          title="No family plans yet"
          action={
            <button type="button" className="family-btn family-btn--primary" onClick={() => openModal('create')}>
              <FiPlus aria-hidden="true" /> Create your first plan
            </button>
          }
        >
          <p>
            A family plan is a shared budget. Invite family or friends, set limits per category and track spending
            together.
          </p>
        </EmptyState>
      </section>
    );
  } else if (selectedPlanId && !plan && details.error) {
    content = <ErrorState message={details.error} onRetry={() => reload(['details'])} retrying={details.loading} />;
  } else if (selectedPlanId && !plan) {
    content = <LoadingState label="Loading plan…" />;
  } else if (plan) {
    content = (
      <div className="family-layout">
        <PlanOverview
          plan={plan}
          expenses={expenses}
          myExpenses={myExpenses}
          categories={categories.data}
          permissions={permissions}
          refreshing={refreshing}
          onRefresh={() => reload()}
          onRetryExpenses={reloadExpenses}
          onOpenSettings={() => openModal('settings')}
          onDeletePlan={askDeletePlan}
          onLeavePlan={askLeavePlan}
        />
        <MembersPanel
          members={members}
          permissions={permissions}
          currentUserId={user?._id}
          onInvite={() => openModal('invite')}
          onChangeRole={handleRoleChange}
          onRemove={askRemoveMember}
          onRetry={() => reload(['members'])}
        />
        {permissions.isAdmin && <SentInvitations key={`${plan._id}-${invitesVersion}`} planId={plan._id} />}
        <ExpensesSection
          key={plan._id}
          plan={plan}
          expenses={expenses}
          myExpenses={myExpenses}
          categories={categories.data}
          permissions={permissions}
          onAdd={() => openModal('expense')}
          onEdit={(expense) => openModal('expense', expense)}
          onDelete={askDeleteExpense}
          onReview={handleReview}
          onRetry={reload}
        />
      </div>
    );
  }

  return (
    <AppLayout className="family-page">
      <header className="family-page-header">
        <h1>Shared budgeting</h1>
        <p className="family-muted">Plan and track spending together with your family or friends.</p>
      </header>

      <PendingInvitations onAccepted={handlePlanJoinedOrCreated} />

      <PlanSelector
        plans={plans}
        selectedPlanId={selectedPlanId}
        onSelect={selectPlan}
        loading={plansLoading}
        error={plansError}
        onRetry={reloadPlans}
        onCreate={() => openModal('create')}
      />

      {content}

      <PlanFormModal
        key={`create-${modal.key}`}
        isOpen={modal.type === 'create'}
        onClose={closeModal}
        defaultCurrency={userCurrency}
        onCreated={(created) => handlePlanJoinedOrCreated(created?._id)}
      />
      {plan && (
        <>
          <PlanSettingsModal
            key={`settings-${modal.key}`}
            isOpen={modal.type === 'settings'}
            onClose={closeModal}
            plan={plan}
            isOwner={permissions.isOwner}
            onSaved={handleSettingsSaved}
          />
          <ExpenseFormModal
            key={`expense-${modal.key}`}
            isOpen={modal.type === 'expense'}
            onClose={closeModal}
            planId={plan._id}
            currency={plan.currency}
            expense={modal.type === 'expense' ? modal.data : null}
            categories={categories.data || []}
            expenses={expenses.data || []}
            needsApproval={plan.require_approval && !permissions.isAdmin}
            onSaved={reloadExpenses}
          />
          <InviteMemberModal
            key={`invite-${modal.key}`}
            isOpen={modal.type === 'invite'}
            onClose={closeModal}
            planId={plan._id}
            planName={plan.plan_name}
            onSent={() => setInvitesVersion((version) => version + 1)}
          />
        </>
      )}
      <ConfirmDialog
        key={`confirm-${modal.key}`}
        isOpen={modal.type === 'confirm'}
        onClose={closeModal}
        {...(modal.type === 'confirm' ? modal.data : {})}
      />
    </AppLayout>
  );
};

export default FamilyBudgetingPage;
