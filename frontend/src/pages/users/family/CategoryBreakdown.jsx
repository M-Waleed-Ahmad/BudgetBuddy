import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FiSliders } from 'react-icons/fi';
import { formatCurrency } from '../../../utils/format';
import BudgetProgress from './BudgetProgress';
import { buildCategoryRows } from './planStats';
import { EmptyState } from './SectionStatus';

/** Per-category limits vs approved spending for the selected plan. */
export default function CategoryBreakdown({ plan, expenses, categories, permissions, onOpenSettings }) {
  const currency = plan.currency;
  const rows = useMemo(() => buildCategoryRows(plan.categoryBudgets, expenses), [plan.categoryBudgets, expenses]);
  const hasLimits = (plan.categoryBudgets || []).length > 0;
  const ownerHasNoCategories = Array.isArray(categories) && categories.length === 0;

  return (
    <div className="family-breakdown">
      <div className="family-breakdown__header">
        <h3 className="family-subtitle">By category</h3>
        {permissions.canManagePlan && !ownerHasNoCategories && (
          <button type="button" className="family-btn family-btn--ghost family-btn--sm" onClick={onOpenSettings}>
            <FiSliders aria-hidden="true" /> {hasLimits ? 'Edit limits' : 'Set limits'}
          </button>
        )}
      </div>

      {ownerHasNoCategories && (
        <EmptyState title="No categories yet">
          {permissions.isOwner ? (
            <p>
              Family plans use the plan owner&apos;s spending categories. Create some on the{' '}
              <Link to="/budget-management">Budget Management</Link> page, then set limits in Plan settings.
            </p>
          ) : (
            <p>
              Family plans use the plan owner&apos;s spending categories, and {plan.owner?.name || 'the owner'}{' '}
              hasn&apos;t created any yet. Expenses can be added once they do.
            </p>
          )}
        </EmptyState>
      )}

      {!ownerHasNoCategories && !hasLimits && (
        <p className="family-muted">
          No category limits are set for this plan yet.
          {permissions.canManagePlan ? ' Use “Set limits” to divide the budget between categories.' : ''}
        </p>
      )}

      {rows.length > 0 && (
        <ul className="family-breakdown__list">
          {rows.map((row) => {
            const over = row.limit > 0 && row.spent > row.limit;
            return (
              <li key={row.id} className="family-breakdown__row">
                <div className="family-breakdown__meta">
                  <span className="family-breakdown__name">{row.name}</span>
                  <span className={over ? 'family-text-danger' : 'family-muted'}>
                    {formatCurrency(row.spent, currency)}
                    {row.limit > 0 ? ` of ${formatCurrency(row.limit, currency)}` : ' · no limit'}
                  </span>
                </div>
                {row.limit > 0 && <BudgetProgress spent={row.spent} limit={row.limit} size="sm" label={`${row.name} spending`} />}
                {over && (
                  <span className="family-text-danger family-breakdown__over">
                    Over by {formatCurrency(row.spent - row.limit, currency)}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
