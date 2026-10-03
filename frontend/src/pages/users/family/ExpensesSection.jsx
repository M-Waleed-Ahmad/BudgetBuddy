import { useMemo, useState } from 'react';
import { FiDownload, FiPlus, FiSearch } from 'react-icons/fi';
import ExpensesTable from './ExpensesTable';
import { downloadExpensesCsv } from './exportCsv';
import { UNCATEGORIZED_ID, UNCATEGORIZED_LABEL, categoryKey, categoryName } from './planStats';
import { EmptyState, ErrorState, LoadingState } from './SectionStatus';

const SORTERS = {
  date_desc: (a, b) => String(b.expense_date).localeCompare(String(a.expense_date)) || String(b.created_at).localeCompare(String(a.created_at)),
  date_asc: (a, b) => String(a.expense_date).localeCompare(String(b.expense_date)) || String(a.created_at).localeCompare(String(b.created_at)),
  amount_desc: (a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0),
  amount_asc: (a, b) => (Number(a.amount) || 0) - (Number(b.amount) || 0),
};

const INITIAL_FILTERS = { search: '', status: '', category: '', sort: 'date_desc' };

/** Expense list for the plan with "all / mine" views, search, filters, sorting and CSV export. */
export default function ExpensesSection({ plan, expenses, myExpenses, categories, permissions, onAdd, onEdit, onDelete, onReview, onRetry }) {
  const [scope, setScope] = useState('all');
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [reviewingId, setReviewingId] = useState(null);

  const source = scope === 'mine' ? myExpenses : expenses;
  const list = useMemo(() => source.data || [], [source.data]);
  const pendingCount = useMemo(() => (expenses.data || []).filter((item) => item.status === 'pending').length, [expenses.data]);

  const categoryOptions = useMemo(() => {
    const options = new Map((categories || []).map((category) => [String(category._id), category.name]));
    list.forEach((expense) => options.set(categoryKey(expense), categoryName(expense)));
    const sorted = [...options].filter(([id]) => id !== UNCATEGORIZED_ID).sort((a, b) => a[1].localeCompare(b[1]));
    if (options.has(UNCATEGORIZED_ID)) sorted.push([UNCATEGORIZED_ID, UNCATEGORIZED_LABEL]);
    return sorted;
  }, [categories, list]);

  const visible = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    return list
      .filter((expense) => !filters.status || expense.status === filters.status)
      .filter((expense) => !filters.category || categoryKey(expense) === filters.category)
      .filter((expense) => {
        if (!query) return true;
        return [expense.description, expense.notes, categoryName(expense), expense.added_by?.name]
          .some((value) => value && String(value).toLowerCase().includes(query));
      })
      .sort(SORTERS[filters.sort]);
  }, [list, filters]);

  const setFilter = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleReview = async (expense, action) => {
    setReviewingId(expense._id);
    try {
      await onReview(expense, action);
    } finally {
      setReviewingId(null);
    }
  };

  const noCategories = Array.isArray(categories) && categories.length === 0;
  const filtersActive = filters.search || filters.status || filters.category;

  return (
    <section className="family-card" aria-labelledby="family-expenses-title">
      <header className="family-card__header">
        <h2 id="family-expenses-title" className="family-card__title">
          Expenses
        </h2>
        <div className="family-card__actions">
          {permissions.isAdmin && pendingCount > 0 && (
            <button
              type="button"
              className="family-btn family-btn--warn family-btn--sm"
              onClick={() => {
                setScope('all');
                setFilters({ ...INITIAL_FILTERS, status: 'pending' });
              }}
            >
              Review {pendingCount} pending
            </button>
          )}
          {permissions.canAddExpense && (
            <button
              type="button"
              className="family-btn family-btn--primary"
              onClick={onAdd}
              disabled={noCategories || !categories}
              title={noCategories ? 'The plan owner needs at least one category first' : undefined}
            >
              <FiPlus aria-hidden="true" /> Add expense
            </button>
          )}
        </div>
      </header>

      <div className="family-tabs" role="group" aria-label="Which expenses to show">
        {[
          ['all', 'All expenses'],
          ['mine', 'My expenses'],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={`family-tab${scope === value ? ' family-tab--active' : ''}`}
            aria-pressed={scope === value}
            onClick={() => setScope(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="family-toolbar">
        <div className="family-toolbar__search">
          <label htmlFor="expense-search" className="family-visually-hidden">
            Search expenses
          </label>
          <FiSearch aria-hidden="true" />
          <input
            id="expense-search"
            name="search"
            type="search"
            className="family-input"
            placeholder="Search description, category or member"
            value={filters.search}
            onChange={setFilter}
          />
        </div>
        <div className="family-toolbar__field">
          <label htmlFor="expense-status">Status</label>
          <select id="expense-status" name="status" className="family-input" value={filters.status} onChange={setFilter}>
            <option value="">All</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div className="family-toolbar__field">
          <label htmlFor="expense-category">Category</label>
          <select id="expense-category" name="category" className="family-input" value={filters.category} onChange={setFilter}>
            <option value="">All</option>
            {categoryOptions.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div className="family-toolbar__field">
          <label htmlFor="expense-sort">Sort</label>
          <select id="expense-sort" name="sort" className="family-input" value={filters.sort} onChange={setFilter}>
            <option value="date_desc">Newest first</option>
            <option value="date_asc">Oldest first</option>
            <option value="amount_desc">Highest amount</option>
            <option value="amount_asc">Lowest amount</option>
          </select>
        </div>
        <button
          type="button"
          className="family-btn family-btn--secondary family-btn--sm family-toolbar__export"
          onClick={() => downloadExpensesCsv(visible, { planName: plan.plan_name, currency: plan.currency })}
          disabled={visible.length === 0}
        >
          <FiDownload aria-hidden="true" /> Export CSV
        </button>
      </div>

      {source.error && (
        <ErrorState message={source.error} onRetry={() => onRetry([scope === 'mine' ? 'myExpenses' : 'expenses'])} retrying={source.loading} />
      )}
      {source.loading && !source.data && <LoadingState label="Loading expenses…" />}

      {source.data && list.length === 0 && (
        <EmptyState title={scope === 'mine' ? "You haven't added any expenses to this plan" : 'No expenses yet'}>
          {permissions.canAddExpense && !noCategories && <p>Use “Add expense” to record the first one.</p>}
          {!permissions.canAddExpense && <p>Viewers can see expenses but can&apos;t add them.</p>}
        </EmptyState>
      )}

      {list.length > 0 && visible.length === 0 && (
        <EmptyState title="No expenses match your filters">
          <button type="button" className="family-btn family-btn--ghost family-btn--sm" onClick={() => setFilters(INITIAL_FILTERS)}>
            Clear filters
          </button>
        </EmptyState>
      )}

      {visible.length > 0 && (
        <>
          <ExpensesTable
            expenses={visible}
            currency={plan.currency}
            permissions={permissions}
            reviewingId={reviewingId}
            onEdit={onEdit}
            onDelete={onDelete}
            onReview={handleReview}
          />
          {filtersActive && (
            <p className="family-muted family-table-caption">
              Showing {visible.length} of {list.length} expenses
            </p>
          )}
        </>
      )}
    </section>
  );
}
