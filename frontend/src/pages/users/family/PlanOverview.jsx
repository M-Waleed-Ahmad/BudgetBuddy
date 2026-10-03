import { useMemo } from 'react';
import { FiLogOut, FiRefreshCw, FiSettings, FiTrash2 } from 'react-icons/fi';
import { formatCurrency, formatDate, percentOf } from '../../../utils/format';
import BudgetProgress from './BudgetProgress';
import CategoryBreakdown from './CategoryBreakdown';
import { roleLabel } from './permissions';
import { summarizeExpenses } from './planStats';
import { ErrorState } from './SectionStatus';

function Stat({ label, value, detail, tone }) {
  return (
    <div className={`family-stat${tone ? ` family-stat--${tone}` : ''}`}>
      <dt>{label}</dt>
      <dd>
        {value}
        {detail && <span className="family-stat__detail">{detail}</span>}
      </dd>
    </div>
  );
}

function periodLabel(plan) {
  if (!plan.start_date && !plan.end_date) return 'No date range set';
  return `${formatDate(plan.start_date)} – ${formatDate(plan.end_date)}`;
}

/** Header, totals, progress and per-category breakdown for the selected plan. */
export default function PlanOverview({
  plan,
  expenses,
  myExpenses,
  categories,
  permissions,
  refreshing,
  onRefresh,
  onRetryExpenses,
  onOpenSettings,
  onDeletePlan,
  onLeavePlan,
}) {
  const currency = plan.currency;
  const money = (amount) => formatCurrency(amount, currency);
  const expenseList = useMemo(() => expenses.data || [], [expenses.data]);
  const totals = useMemo(() => summarizeExpenses(expenseList), [expenseList]);
  const mine = useMemo(() => summarizeExpenses(myExpenses.data || []), [myExpenses.data]);

  const total = Number(plan.total_budget_amount) || 0;
  const remaining = total - totals.approvedTotal;
  const overBudget = total > 0 && remaining < 0;
  const expensesReady = Boolean(expenses.data);
  const placeholder = expenses.loading ? '…' : '—';

  return (
    <section className="family-card family-overview" aria-labelledby="family-overview-title">
      <header className="family-overview__header">
        <div>
          <h2 id="family-overview-title" className="family-card__title">
            {plan.plan_name}
          </h2>
          <p className="family-muted family-overview__meta">
            <span className={`family-badge family-badge--${permissions.role}`}>{roleLabel(permissions.role)}</span>
            {permissions.isOwner && <span className="family-badge family-badge--owner">Owner</span>}
            {plan.require_approval && <span className="family-badge family-badge--neutral">Approval required</span>}
            <span>{periodLabel(plan)}</span>
            {!permissions.isOwner && plan.owner?.name && <span>Owner: {plan.owner.name}</span>}
          </p>
        </div>
        <div className="family-overview__actions">
          <button
            type="button"
            className="family-btn family-btn--ghost family-btn--icon"
            onClick={onRefresh}
            disabled={refreshing}
            aria-label="Refresh plan data"
            title="Refresh plan data"
          >
            <FiRefreshCw aria-hidden="true" className={refreshing ? 'family-spin' : undefined} />
          </button>
          {permissions.canManagePlan && (
            <button type="button" className="family-btn family-btn--secondary" onClick={onOpenSettings}>
              <FiSettings aria-hidden="true" /> Settings
            </button>
          )}
          {permissions.canDeletePlan && (
            <button type="button" className="family-btn family-btn--danger-outline" onClick={onDeletePlan}>
              <FiTrash2 aria-hidden="true" /> Delete plan
            </button>
          )}
          {permissions.canLeavePlan && (
            <button type="button" className="family-btn family-btn--danger-outline" onClick={onLeavePlan}>
              <FiLogOut aria-hidden="true" /> Leave plan
            </button>
          )}
        </div>
      </header>

      {expenses.error && !expensesReady && <ErrorState message={expenses.error} onRetry={onRetryExpenses} />}

      <dl className="family-stats">
        <Stat label="Total budget" value={total > 0 ? money(total) : 'Not set'} />
        <Stat label="Spent" value={expensesReady ? money(totals.approvedTotal) : placeholder} detail="Approved expenses" />
        <Stat
          label={overBudget ? 'Over budget' : 'Remaining'}
          value={!expensesReady ? placeholder : total > 0 ? money(Math.abs(remaining)) : '—'}
          tone={overBudget ? 'danger' : undefined}
        />
        <Stat
          label="Pending approval"
          value={expensesReady ? money(totals.pendingTotal) : placeholder}
          detail={expensesReady ? `${totals.pendingCount} expense${totals.pendingCount === 1 ? '' : 's'}` : undefined}
          tone={totals.pendingCount > 0 ? 'warn' : undefined}
        />
      </dl>

      {total > 0 && expensesReady && (
        <div className="family-overview__progress">
          <BudgetProgress spent={totals.approvedTotal} limit={total} label="Plan budget used" />
          <p className={`family-progress-caption${overBudget ? ' family-text-danger' : ''}`}>
            {Math.round((totals.approvedTotal / total) * 100)}% of the budget used
            {overBudget && ` — ${money(-remaining)} over`}
          </p>
        </div>
      )}

      {myExpenses.data && (
        <p className="family-contribution">
          <strong>Your contribution:</strong> {money(mine.approvedTotal)} approved
          {totals.approvedTotal > 0 && ` (${Math.round(percentOf(mine.approvedTotal, totals.approvedTotal))}% of plan spending)`}
          {mine.pendingCount > 0 && ` · ${money(mine.pendingTotal)} awaiting approval`}
        </p>
      )}

      <CategoryBreakdown
        plan={plan}
        expenses={expenseList}
        categories={categories}
        permissions={permissions}
        onOpenSettings={onOpenSettings}
      />
    </section>
  );
}
