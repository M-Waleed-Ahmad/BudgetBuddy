import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FiDownload, FiEdit2, FiPlus, FiRefreshCw, FiTrash2 } from 'react-icons/fi';
import AppLayout from '../../components/AppLayout';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import SectionState from '../../components/SectionState';
import ProgressBar from '../../components/ProgressBar';
import { useAuth } from '../../context/AuthContext';
import { useAsyncData } from '../../hooks/useAsyncData';
import {
  addExpense,
  deleteExpense,
  fetchExpensesForCurrentMonth,
  getBudgetsForMonth,
  getCategories,
  getCurrentMonthBudget,
  updateExpense,
} from '../../api';
import { formatDate, toDateInputValue, todayInputValue } from '../../utils/format';
import { downloadCsv } from '../../utils/csv';
import '../../styles/ExpenseManagementPage.css';

const loadCategories = async () => (await getCategories()) || [];

const SORT_OPTIONS = {
  date_desc: { label: 'Date (newest)', compare: (a, b) => String(b.expense_date).localeCompare(String(a.expense_date)) },
  date_asc: { label: 'Date (oldest)', compare: (a, b) => String(a.expense_date).localeCompare(String(b.expense_date)) },
  amount_desc: { label: 'Amount (high → low)', compare: (a, b) => b.amount - a.amount },
  amount_asc: { label: 'Amount (low → high)', compare: (a, b) => a.amount - b.amount },
};

const NOTES_PREVIEW_LENGTH = 40;
const UNCATEGORIZED = '__uncategorized__';

const categoryIdOf = (expense) => (expense.category_id?._id ? String(expense.category_id._id) : null);
const categoryNameOf = (expense) => expense.category_id?.name || 'Uncategorized';

function formatPeriod(period) {
  if (!period?.start || !period?.end) return '';
  const sameYear = String(period.start).slice(0, 4) === String(period.end).slice(0, 4);
  const start = formatDate(period.start, sameYear ? { year: undefined } : {});
  const source = period.source === 'budget' ? 'from your monthly budget' : 'calendar month';
  return `${start} – ${formatDate(period.end)} · ${source}`;
}

const emptyForm = () => ({ category_id: '', amount: '', description: '', expense_date: todayInputValue(), notes: '' });

const ExpenseManagementPage = () => {
  const { formatMoney, currency } = useAuth();

  // --- Data ---
  const expensesData = useAsyncData(fetchExpensesForCurrentMonth);
  const monthly = useAsyncData(getCurrentMonthBudget);
  const categories = useAsyncData(loadCategories, { initialData: [] });

  const expenses = useMemo(() => expensesData.data?.expenses || [], [expensesData.data]);
  const totalSpent = Number(expensesData.data?.totalSpent) || 0;
  const period = expensesData.data?.period;
  const monthlyBudget = monthly.data;
  const target = Number(monthlyBudget?.total_budget_amount) || 0;
  const categoryList = useMemo(() => categories.data || [], [categories.data]);

  // Category limits belong to the month the current period starts in.
  const monthYear = monthlyBudget?.month_year || (period?.start ? String(period.start).slice(0, 7) : null);
  const loadLimits = useCallback(async () => (monthYear ? (await getBudgetsForMonth(monthYear)) || [] : []), [monthYear]);
  const limits = useAsyncData(loadLimits, { initialData: [], immediate: false, initialLoading: true });
  const reloadLimits = limits.reload;

  useEffect(() => {
    if (!monthly.loading && !expensesData.loading) reloadLimits();
  }, [monthly.loading, expensesData.loading, reloadLimits]);

  const spentByCategory = useMemo(() => {
    const map = new Map();
    expenses.forEach((expense) => {
      const id = categoryIdOf(expense);
      if (id) map.set(id, (map.get(id) || 0) + (Number(expense.amount) || 0));
    });
    return map;
  }, [expenses]);

  const limitRows = useMemo(
    () =>
      (limits.data || []).map((item) => {
        const limit = Number(item.limit_amount) || 0;
        const spent = spentByCategory.get(String(item.category_id)) || 0;
        return { id: item._id, categoryId: String(item.category_id), name: item.category_name || 'Uncategorized', limit, spent };
      }),
    [limits.data, spentByCategory]
  );

  // --- Table controls ---
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortKey, setSortKey] = useState('date_desc');

  const visibleExpenses = useMemo(() => {
    const query = search.trim().toLowerCase();
    return expenses
      .filter((expense) => {
        if (categoryFilter === UNCATEGORIZED && categoryIdOf(expense)) return false;
        if (categoryFilter && categoryFilter !== UNCATEGORIZED && categoryIdOf(expense) !== categoryFilter) return false;
        if (!query) return true;
        return [expense.description, expense.notes, categoryNameOf(expense)].some((value) =>
          (value || '').toLowerCase().includes(query)
        );
      })
      .sort(SORT_OPTIONS[sortKey].compare);
  }, [expenses, search, categoryFilter, sortKey]);

  const handleExport = () => {
    downloadCsv(
      `expenses-${period?.start || 'current'}.csv`,
      ['Date', 'Category', 'Description', `Amount (${currency})`, 'Notes'],
      visibleExpenses.map((expense) => [
        toDateInputValue(expense.expense_date),
        categoryNameOf(expense),
        expense.description || '',
        Number(expense.amount) || 0,
        expense.notes || '',
      ])
    );
  };

  const refreshAll = () => {
    expensesData.reload();
    monthly.reload();
    categories.reload();
  };

  // --- Add / edit modal ---
  const [editor, setEditor] = useState(null); // null | { expense?: Expense }
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const editingExpense = editor?.expense || null;

  const openEditor = (expense = null) => {
    setForm(
      expense
        ? {
            category_id: categoryIdOf(expense) || '',
            amount: String(expense.amount ?? ''),
            description: expense.description || '',
            expense_date: toDateInputValue(expense.expense_date),
            notes: expense.notes || '',
          }
        : { ...emptyForm(), category_id: categoryList[0]?._id ? String(categoryList[0]._id) : '' }
    );
    setFormError('');
    setEditor({ expense });
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const selectedLimit = limitRows.find((row) => row.categoryId === form.category_id);
  const amountDelta =
    (Number(form.amount) || 0) -
    (editingExpense && categoryIdOf(editingExpense) === form.category_id ? Number(editingExpense.amount) || 0 : 0);
  const willExceedLimit = selectedLimit && selectedLimit.spent + amountDelta > selectedLimit.limit;

  const handleSubmit = async (event) => {
    event.preventDefault();
    const amount = Number(form.amount);
    if (!form.category_id) return setFormError('Please choose a category.');
    if (!Number.isFinite(amount) || amount <= 0) return setFormError('The amount must be greater than zero.');
    if (!form.expense_date) return setFormError('Please choose a date.');

    const payload = {
      category_id: form.category_id,
      amount,
      description: form.description.trim(),
      notes: form.notes.trim(),
      expense_date: form.expense_date,
    };
    setIsSaving(true);
    setFormError('');
    try {
      if (editingExpense) {
        await updateExpense(editingExpense._id, payload);
        toast.success('Expense updated.');
      } else {
        await addExpense(payload);
        toast.success('Expense added.');
      }
      setEditor(null);
      expensesData.reload({ silent: true });
    } catch (err) {
      setFormError(err.message || 'Could not save the expense.');
    } finally {
      setIsSaving(false);
    }
  };

  // --- Delete ---
  const [deleting, setDeleting] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    setDeleteError('');
    try {
      await deleteExpense(deleting._id);
      toast.success('Expense deleted.');
      setDeleting(null);
      expensesData.reload({ silent: true });
    } catch (err) {
      setDeleteError(err.message || 'Could not delete the expense.');
    } finally {
      setIsDeleting(false);
    }
  };

  // --- Notes viewer ---
  const [viewingNotes, setViewingNotes] = useState(null);

  const remaining = target - totalSpent;
  const isBusy = expensesData.loading || monthly.loading || categories.loading;

  return (
    <AppLayout className="expense-page">
      <div className="page-header">
        <div>
          <h1>Expense management</h1>
          <p className="page-subtitle">{period ? formatPeriod(period) : 'Expenses for the current period'}</p>
        </div>
        <div className="expense-page__header-actions">
          <button type="button" className="secondary-button" onClick={refreshAll} disabled={isBusy}>
            <FiRefreshCw aria-hidden="true" /> Refresh
          </button>
          <button
            type="button"
            className="primary-button"
            onClick={() => openEditor()}
            disabled={categories.loading || categoryList.length === 0}
          >
            <FiPlus aria-hidden="true" /> Add expense
          </button>
        </div>
      </div>

      {!categories.loading && !categories.error && categoryList.length === 0 && (
        <p className="info-message">
          You need at least one category before adding expenses.{' '}
          <Link to="/budget-management">Create a category</Link>.
        </p>
      )}

      <div className="expense-page__summary">
        <section className="card" aria-labelledby="expense-summary-title">
          <h2 id="expense-summary-title" className="card-title">
            Budget summary
          </h2>
          <SectionState
            loading={expensesData.loading || monthly.loading}
            error={expensesData.error || monthly.error}
            onRetry={refreshAll}
          >
            <dl className="expense-page__facts">
              <div>
                <dt>Spent</dt>
                <dd>{formatMoney(totalSpent)}</dd>
              </div>
              <div>
                <dt>Target</dt>
                <dd>{monthlyBudget ? formatMoney(target) : '—'}</dd>
              </div>
              <div>
                <dt>{remaining >= 0 ? 'Remaining' : 'Over budget'}</dt>
                <dd className={monthlyBudget && remaining < 0 ? 'is-negative' : ''}>
                  {monthlyBudget ? formatMoney(Math.abs(remaining)) : '—'}
                </dd>
              </div>
            </dl>
            {monthlyBudget ? (
              <ProgressBar
                used={totalSpent}
                total={target}
                label="Overall"
                detail={`${target > 0 ? Math.round((totalSpent / target) * 100) : 0}% of target`}
              />
            ) : (
              <p className="field-hint">
                No monthly budget set. <Link to="/budget-management">Set one</Link> to track your progress.
              </p>
            )}
          </SectionState>
        </section>

        <section className="card" aria-labelledby="expense-limits-title">
          <h2 id="expense-limits-title" className="card-title">
            Category limits vs spent
          </h2>
          <SectionState
            loading={limits.loading}
            error={limits.error}
            onRetry={limits.reload}
            empty={limitRows.length === 0}
            emptyMessage="No category limits set for this period."
          >
            <div className="expense-page__limit-list">
              {limitRows.map((row) => (
                <ProgressBar
                  key={row.id}
                  label={row.name}
                  used={row.spent}
                  total={row.limit}
                  detail={`${formatMoney(row.spent)} / ${formatMoney(row.limit)}`}
                />
              ))}
            </div>
          </SectionState>
        </section>
      </div>

      <section className="card" aria-labelledby="expense-list-title">
        <h2 id="expense-list-title" className="card-title">
          Expenses
        </h2>

        <div className="toolbar expense-page__toolbar">
          <div className="toolbar-field grow">
            <label htmlFor="expense-search">Search</label>
            <input
              id="expense-search"
              type="search"
              className="input-field"
              placeholder="Description, notes or category"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="toolbar-field">
            <label htmlFor="expense-filter-category">Category</label>
            <select
              id="expense-filter-category"
              className="select-field"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All categories</option>
              {categoryList.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
              <option value={UNCATEGORIZED}>Uncategorized</option>
            </select>
          </div>
          <div className="toolbar-field">
            <label htmlFor="expense-sort">Sort by</label>
            <select id="expense-sort" className="select-field" value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
              {Object.entries(SORT_OPTIONS).map(([key, option]) => (
                <option key={key} value={key}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="toolbar-actions">
            <button type="button" className="secondary-button" onClick={handleExport} disabled={visibleExpenses.length === 0}>
              <FiDownload aria-hidden="true" /> Export CSV
            </button>
          </div>
        </div>

        <SectionState
          loading={expensesData.loading}
          error={expensesData.error}
          onRetry={expensesData.reload}
          empty={expenses.length === 0}
          emptyMessage="No expenses recorded for this period yet."
        >
          {visibleExpenses.length === 0 ? (
            <p className="no-data-message">No expenses match your filters.</p>
          ) : (
            <div className="table-wrapper">
              <table className="data-table expense-page__table">
                <caption className="visually-hidden">Expenses for the current period</caption>
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col">Category</th>
                    <th scope="col">Description</th>
                    <th scope="col" className="numeric">
                      Amount
                    </th>
                    <th scope="col">Notes</th>
                    <th scope="col" className="actions">
                      <span className="visually-hidden">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visibleExpenses.map((expense) => {
                    const notes = expense.notes || '';
                    const isLong = notes.length > NOTES_PREVIEW_LENGTH;
                    const label = expense.description || 'expense';
                    return (
                      <tr key={expense._id}>
                        <td className="expense-page__nowrap">{formatDate(expense.expense_date)}</td>
                        <td>{categoryNameOf(expense)}</td>
                        <td>{expense.description || '—'}</td>
                        <td className="numeric">{formatMoney(expense.amount)}</td>
                        <td className="expense-page__notes">
                          {notes ? (isLong ? `${notes.slice(0, NOTES_PREVIEW_LENGTH)}…` : notes) : '—'}
                          {isLong && (
                            <button type="button" className="link-button expense-page__more" onClick={() => setViewingNotes(notes)}>
                              Read more
                            </button>
                          )}
                        </td>
                        <td className="actions">
                          <button
                            type="button"
                            className="icon-button"
                            onClick={() => openEditor(expense)}
                            aria-label={`Edit ${label}`}
                            title="Edit"
                          >
                            <FiEdit2 aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            className="icon-button danger"
                            onClick={() => {
                              setDeleteError('');
                              setDeleting(expense);
                            }}
                            aria-label={`Delete ${label}`}
                            title="Delete"
                          >
                            <FiTrash2 aria-hidden="true" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <th scope="row" colSpan={3}>
                      Total ({visibleExpenses.length} {visibleExpenses.length === 1 ? 'expense' : 'expenses'})
                    </th>
                    <td className="numeric">
                      <strong>{formatMoney(visibleExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0))}</strong>
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </SectionState>
      </section>

      {/* Add / edit expense */}
      <Modal isOpen={editor !== null} onClose={() => !isSaving && setEditor(null)} title={editingExpense ? 'Edit expense' : 'Add expense'}>
        <form onSubmit={handleSubmit} className="modal-form" noValidate>
          {formError && (
            <p className="error-message" role="alert">
              {formError}
            </p>
          )}
          <div className="form-group">
            <label htmlFor="expense-date">Date</label>
            <input
              id="expense-date"
              type="date"
              name="expense_date"
              className="input-field"
              value={form.expense_date}
              onChange={handleFormChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="expense-category">Category</label>
            <select
              id="expense-category"
              name="category_id"
              className="select-field"
              value={form.category_id}
              onChange={handleFormChange}
              aria-describedby="expense-category-hint"
              required
            >
              <option value="" disabled>
                Select a category
              </option>
              {categoryList.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
            <span id="expense-category-hint" className={willExceedLimit ? 'field-error' : 'field-hint'}>
              {selectedLimit
                ? willExceedLimit
                  ? `This will exceed the ${formatMoney(selectedLimit.limit)} limit for ${selectedLimit.name}.`
                  : `Remaining limit: ${formatMoney(selectedLimit.limit - selectedLimit.spent)}`
                : 'No limit set for this category.'}
            </span>
          </div>
          <div className="form-group">
            <label htmlFor="expense-amount">Amount ({currency})</label>
            <input
              id="expense-amount"
              type="number"
              name="amount"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              className="input-field"
              value={form.amount}
              onChange={handleFormChange}
              placeholder="e.g. 25.50"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="expense-description">Description</label>
            <input
              id="expense-description"
              type="text"
              name="description"
              className="input-field"
              maxLength={200}
              value={form.description}
              onChange={handleFormChange}
              placeholder="e.g. Lunch with a client"
            />
          </div>
          <div className="form-group">
            <label htmlFor="expense-notes">Notes (optional)</label>
            <textarea
              id="expense-notes"
              name="notes"
              className="textarea-field"
              maxLength={1000}
              value={form.notes}
              onChange={handleFormChange}
            />
          </div>
          <div className="form-actions">
            <button type="button" className="secondary-button" onClick={() => setEditor(null)} disabled={isSaving}>
              Cancel
            </button>
            <button type="submit" className="primary-button" disabled={isSaving}>
              {isSaving ? 'Saving…' : editingExpense ? 'Save changes' : 'Add expense'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleting !== null}
        title="Delete expense"
        message={
          <>
            Delete <strong>{deleting?.description || 'this expense'}</strong> ({formatMoney(deleting?.amount)}, {formatDate(deleting?.expense_date)})?
            This can&apos;t be undone.
          </>
        }
        confirmLabel="Delete expense"
        busy={isDeleting}
        error={deleteError}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />

      <Modal isOpen={viewingNotes !== null} onClose={() => setViewingNotes(null)} title="Expense notes">
        <p className="expense-page__notes-full">{viewingNotes}</p>
        <div className="form-actions">
          <button type="button" className="primary-button" onClick={() => setViewingNotes(null)}>
            Close
          </button>
        </div>
      </Modal>
    </AppLayout>
  );
};

export default ExpenseManagementPage;
