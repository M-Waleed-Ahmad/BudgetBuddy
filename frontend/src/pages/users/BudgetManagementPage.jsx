import { useCallback, useEffect, useMemo, useState } from 'react';
import EChart from '../../components/EChart';
import { toast } from 'react-hot-toast';
import { FiDownload, FiEdit2, FiPlus, FiRefreshCw, FiTrash2 } from 'react-icons/fi';
import AppLayout from '../../components/AppLayout';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import SectionState from '../../components/SectionState';
import ProgressBar from '../../components/ProgressBar';
import CategoryManager from '../../components/CategoryManager';
import { useAuth } from '../../context/AuthContext';
import { useAsyncData } from '../../hooks/useAsyncData';
import {
  addBudgetItem,
  createMonthlyBudget,
  deleteBudgetItem,
  getBudgetsForMonth,
  getCategories,
  getCategoryWiseSpendingForCurrentMonth,
  getCurrentMonthBudget,
  updateBudgetItem,
  updateMonthlyBudget,
} from '../../api';
import {
  currentYearMonth,
  formatDate,
  formatMonthYear,
  monthBounds,
  toDateInputValue,
} from '../../utils/format';
import { downloadCsv } from '../../utils/csv';
import '../../styles/BudgetManagementPage.css';

const loadCategorySpending = async () => (await getCategoryWiseSpendingForCurrentMonth())?.categoryWiseSpending || [];
const loadCategories = async () => (await getCategories()) || [];

const SORT_OPTIONS = {
  category: { label: 'Category (A–Z)', compare: (a, b) => a.categoryName.localeCompare(b.categoryName) },
  limit_desc: { label: 'Limit (high → low)', compare: (a, b) => b.limit - a.limit },
  usage_desc: { label: 'Usage (high → low)', compare: (a, b) => b.usage - a.usage },
  remaining_asc: { label: 'Remaining (low → high)', compare: (a, b) => a.remaining - b.remaining },
};

const emptyItemForm = { category_id: '', limit_amount: '', description: '' };

const BudgetManagementPage = () => {
  const { formatMoney, currency } = useAuth();

  // --- Data (each section loads independently) ---
  const monthly = useAsyncData(getCurrentMonthBudget);
  const spending = useAsyncData(loadCategorySpending, { initialData: [] });
  const categories = useAsyncData(loadCategories, { initialData: [] });

  const monthlyBudget = monthly.data;
  const monthYear = monthlyBudget?.month_year || currentYearMonth();
  const loadBudgets = useCallback(async () => (await getBudgetsForMonth(monthYear)) || [], [monthYear]);
  const budgets = useAsyncData(loadBudgets, { initialData: [], immediate: false, initialLoading: true });
  const reloadBudgets = budgets.reload;

  // Category limits belong to the month of the current budget period, so wait for it.
  useEffect(() => {
    if (!monthly.loading) reloadBudgets();
  }, [monthly.loading, reloadBudgets]);

  const budgetItems = useMemo(() => budgets.data || [], [budgets.data]);
  const categoryList = useMemo(() => categories.data || [], [categories.data]);

  // --- Derived data ---
  const spentByCategory = useMemo(() => {
    const map = new Map();
    (spending.data || []).forEach((entry) => map.set(String(entry.categoryId), Number(entry.totalSpent) || 0));
    return map;
  }, [spending.data]);

  const rows = useMemo(
    () =>
      budgetItems.map((item) => {
        const limit = Number(item.limit_amount) || 0;
        const spent = spentByCategory.get(String(item.category_id)) || 0;
        return {
          ...item,
          categoryName: item.category_name || 'Uncategorized',
          limit,
          spent,
          remaining: limit - spent,
          usage: limit > 0 ? spent / limit : 0,
        };
      }),
    [budgetItems, spentByCategory]
  );

  const totalLimits = useMemo(() => rows.reduce((sum, row) => sum + row.limit, 0), [rows]);
  const target = Number(monthlyBudget?.total_budget_amount) || 0;

  // --- Table controls ---
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('category');

  const visibleRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = query
      ? rows.filter(
          (row) =>
            row.categoryName.toLowerCase().includes(query) || (row.description || '').toLowerCase().includes(query)
        )
      : rows;
    return [...filtered].sort(SORT_OPTIONS[sortKey].compare);
  }, [rows, search, sortKey]);

  const handleExport = () => {
    downloadCsv(
      `budgets-${monthYear}.csv`,
      ['Category', `Limit (${currency})`, `Spent (${currency})`, `Remaining (${currency})`, 'Description'],
      visibleRows.map((row) => [row.categoryName, row.limit, row.spent, row.remaining, row.description || ''])
    );
  };

  const refreshAll = () => {
    monthly.reload();
    spending.reload();
    categories.reload();
  };

  // --- Monthly budget modal ---
  const [isMonthlyOpen, setIsMonthlyOpen] = useState(false);
  const [monthlyForm, setMonthlyForm] = useState({ total_budget_amount: '', start_date: '', end_date: '' });
  const [monthlyError, setMonthlyError] = useState('');
  const [isSavingMonthly, setIsSavingMonthly] = useState(false);

  const openMonthlyModal = () => {
    const defaults = monthBounds();
    setMonthlyForm({
      total_budget_amount: monthlyBudget ? String(monthlyBudget.total_budget_amount ?? '') : '',
      start_date: monthlyBudget ? toDateInputValue(monthlyBudget.start_date) : defaults.start,
      end_date: monthlyBudget ? toDateInputValue(monthlyBudget.end_date) : defaults.end,
    });
    setMonthlyError('');
    setIsMonthlyOpen(true);
  };

  const handleMonthlySubmit = async (event) => {
    event.preventDefault();
    const amount = Number(monthlyForm.total_budget_amount);
    const { start_date: startDate, end_date: endDate } = monthlyForm;
    if (!Number.isFinite(amount) || amount <= 0) return setMonthlyError('Enter a budget amount greater than zero.');
    if (!startDate || !endDate) return setMonthlyError('Start and end dates are required.');
    if (endDate < startDate) return setMonthlyError('The end date must be on or after the start date.');

    const payload = { total_budget_amount: amount, start_date: startDate, end_date: endDate };
    setIsSavingMonthly(true);
    setMonthlyError('');
    try {
      const saved = monthlyBudget?._id
        ? await updateMonthlyBudget(monthlyBudget._id, payload)
        : await createMonthlyBudget(payload);
      monthly.setData(saved);
      toast.success(monthlyBudget?._id ? 'Monthly budget updated.' : 'Monthly budget created.');
      setIsMonthlyOpen(false);
      spending.reload({ silent: true });
    } catch (err) {
      setMonthlyError(err.message || 'Could not save the monthly budget.');
    } finally {
      setIsSavingMonthly(false);
    }
  };

  // --- Category limit modal ---
  const [itemModal, setItemModal] = useState(null); // null | { item?: Budget }
  const [itemForm, setItemForm] = useState(emptyItemForm);
  const [itemError, setItemError] = useState('');
  const [isSavingItem, setIsSavingItem] = useState(false);

  const budgetedCategoryIds = useMemo(() => new Set(budgetItems.map((item) => String(item.category_id))), [budgetItems]);
  const editingItem = itemModal?.item || null;
  const selectableCategories = categoryList.filter(
    (category) => !budgetedCategoryIds.has(String(category._id)) || String(category._id) === String(editingItem?.category_id)
  );

  const openItemModal = (item = null) => {
    const firstFree = categoryList.find((category) => !budgetedCategoryIds.has(String(category._id)));
    setItemForm(
      item
        ? { category_id: String(item.category_id || ''), limit_amount: String(item.limit_amount ?? ''), description: item.description || '' }
        : { ...emptyItemForm, category_id: firstFree ? String(firstFree._id) : '' }
    );
    setItemError('');
    setItemModal({ item });
  };

  const handleItemChange = (event) => {
    const { name, value } = event.target;
    setItemForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemSubmit = async (event) => {
    event.preventDefault();
    const limit = Number(itemForm.limit_amount);
    if (!itemForm.category_id) return setItemError('Please choose a category.');
    if (!Number.isFinite(limit) || limit <= 0) return setItemError('The limit must be greater than zero.');

    const payload = {
      category_id: itemForm.category_id,
      limit_amount: limit,
      description: itemForm.description.trim(),
    };
    setIsSavingItem(true);
    setItemError('');
    try {
      if (editingItem) {
        await updateBudgetItem(editingItem._id, payload);
        toast.success('Category limit updated.');
      } else {
        await addBudgetItem({ ...payload, month_year: monthYear });
        toast.success('Category limit added.');
      }
      setItemModal(null);
      budgets.reload({ silent: true });
    } catch (err) {
      setItemError(err.message || 'Could not save the category limit.');
    } finally {
      setIsSavingItem(false);
    }
  };

  // --- Delete category limit ---
  const [deletingItem, setDeletingItem] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteItem = async () => {
    setIsDeleting(true);
    setDeleteError('');
    try {
      await deleteBudgetItem(deletingItem._id);
      toast.success('Category limit deleted.');
      setDeletingItem(null);
      budgets.reload({ silent: true });
    } catch (err) {
      setDeleteError(err.message || 'Could not delete the category limit.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCategoriesChanged = async () => {
    await Promise.all([categories.reload({ silent: true }), budgets.reload({ silent: true })]);
  };

  // --- Allocation chart ---
  const allocationOptions = useMemo(() => {
    const unallocated = Math.max(0, target - totalLimits);
    const data =
      totalLimits === 0 && unallocated === 0
        ? [{ value: 1, name: 'Nothing allocated', itemStyle: { color: '#e5e7eb' } }]
        : [
            { value: totalLimits, name: 'Allocated to categories', itemStyle: { color: '#6960ec' } },
            { value: unallocated, name: 'Unallocated', itemStyle: { color: '#f59e0b' } },
          ].filter((segment) => segment.value > 0);
    return {
      tooltip: {
        trigger: 'item',
        formatter: (params) =>
          params.name === 'Nothing allocated' ? params.name : `${params.name}: ${formatMoney(params.value)} (${params.percent}%)`,
      },
      series: [
        {
          name: 'Budget allocation',
          type: 'pie',
          radius: ['62%', '85%'],
          label: { show: false },
          labelLine: { show: false },
          data,
        },
      ],
    };
  }, [target, totalLimits, formatMoney]);

  const isBusy = monthly.loading || budgets.loading || categories.loading || spending.loading;

  return (
    <AppLayout className="budget-page">
      <div className="page-header">
        <div>
          <h1>Budget management</h1>
          <p className="page-subtitle">Set your overall monthly budget and a spending limit for each category.</p>
        </div>
        <button type="button" className="secondary-button" onClick={refreshAll} disabled={isBusy}>
          <FiRefreshCw aria-hidden="true" /> Refresh
        </button>
      </div>

      {/* Overall monthly budget */}
      <section className="card budget-page__summary" aria-labelledby="budget-summary-title">
        <div className="budget-page__summary-details">
          <div className="budget-page__summary-header">
            <h2 id="budget-summary-title" className="card-title">
              Monthly budget
            </h2>
            {monthlyBudget && (
              <button type="button" className="ghost-button small-button" onClick={openMonthlyModal}>
                <FiEdit2 aria-hidden="true" /> Edit
              </button>
            )}
          </div>
          <SectionState
            loading={monthly.loading}
            error={monthly.error}
            onRetry={monthly.reload}
            empty={!monthlyBudget}
            emptyMessage={
              <>
                <p>No budget is set for the current period.</p>
                <button type="button" className="primary-button small-button" onClick={openMonthlyModal}>
                  <FiPlus aria-hidden="true" /> Create monthly budget
                </button>
              </>
            }
          >
            <dl className="budget-page__facts">
              <div>
                <dt>Overall target</dt>
                <dd>{formatMoney(target)}</dd>
              </div>
              <div>
                <dt>Period</dt>
                <dd>
                  {formatDate(monthlyBudget?.start_date)} – {formatDate(monthlyBudget?.end_date)}
                </dd>
              </div>
              <div>
                <dt>Allocated to categories</dt>
                <dd>{formatMoney(totalLimits)}</dd>
              </div>
            </dl>
            {totalLimits > target && (
              <p className="info-message">
                Your category limits add up to {formatMoney(totalLimits - target)} more than the overall target.
              </p>
            )}
          </SectionState>
        </div>
        {monthlyBudget && !budgets.loading && (
          <div className="budget-page__chart">
            <EChart option={allocationOptions} style={{ height: 170, width: '100%' }} notMerge lazyUpdate />
            <p className="budget-page__chart-caption">Allocation of your monthly target</p>
          </div>
        )}
      </section>

      {/* Category limits */}
      <section className="card" aria-labelledby="budget-limits-title">
        <div className="budget-page__section-header">
          <h2 id="budget-limits-title" className="card-title">
            Category limits for {formatMonthYear(monthYear)}
          </h2>
          <button
            type="button"
            className="primary-button"
            onClick={() => openItemModal()}
            disabled={categories.loading || categoryList.length === 0}
            title={categoryList.length === 0 ? 'Add a category first' : undefined}
          >
            <FiPlus aria-hidden="true" /> Add category limit
          </button>
        </div>

        <div className="toolbar budget-page__toolbar">
          <div className="toolbar-field grow">
            <label htmlFor="budget-search">Search</label>
            <input
              id="budget-search"
              type="search"
              className="input-field"
              placeholder="Category or description"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="toolbar-field">
            <label htmlFor="budget-sort">Sort by</label>
            <select id="budget-sort" className="select-field" value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
              {Object.entries(SORT_OPTIONS).map(([key, option]) => (
                <option key={key} value={key}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="toolbar-actions">
            <button type="button" className="secondary-button" onClick={handleExport} disabled={visibleRows.length === 0}>
              <FiDownload aria-hidden="true" /> Export CSV
            </button>
          </div>
        </div>

        <div className="budget-page__limits">
          <SectionState
            loading={budgets.loading || monthly.loading}
            error={budgets.error}
            onRetry={budgets.reload}
            empty={rows.length === 0}
            emptyMessage={
              categoryList.length === 0 && !categories.loading
                ? 'Add an expense category below, then set a limit for it here.'
                : 'No category limits set for this month yet.'
            }
          >
            {visibleRows.length === 0 ? (
              <p className="no-data-message">No limits match “{search}”.</p>
            ) : (
              <div className="table-wrapper">
                <table className="data-table">
                  <caption className="visually-hidden">Category budget limits</caption>
                  <thead>
                    <tr>
                      <th scope="col">Category</th>
                      <th scope="col" className="numeric">
                        Limit
                      </th>
                      <th scope="col" className="numeric">
                        Spent
                      </th>
                      <th scope="col" className="numeric">
                        Remaining
                      </th>
                      <th scope="col">Description</th>
                      <th scope="col" className="actions">
                        <span className="visually-hidden">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRows.map((row) => (
                      <tr key={row._id}>
                        <td>{row.categoryName}</td>
                        <td className="numeric">{formatMoney(row.limit)}</td>
                        <td className="numeric">{formatMoney(row.spent)}</td>
                        <td className={`numeric${row.remaining < 0 ? ' budget-page__negative' : ''}`}>
                          {formatMoney(row.remaining)}
                        </td>
                        <td>{row.description || '—'}</td>
                        <td className="actions">
                          <button
                            type="button"
                            className="icon-button"
                            onClick={() => openItemModal(row)}
                            aria-label={`Edit ${row.categoryName} limit`}
                            title="Edit"
                          >
                            <FiEdit2 aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            className="icon-button danger"
                            onClick={() => {
                              setDeleteError('');
                              setDeletingItem(row);
                            }}
                            aria-label={`Delete ${row.categoryName} limit`}
                            title="Delete"
                          >
                            <FiTrash2 aria-hidden="true" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <th scope="row">Total</th>
                      <td className="numeric">
                        <strong>{formatMoney(visibleRows.reduce((sum, row) => sum + row.limit, 0))}</strong>
                      </td>
                      <td className="numeric">
                        <strong>{formatMoney(visibleRows.reduce((sum, row) => sum + row.spent, 0))}</strong>
                      </td>
                      <td colSpan={3} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </SectionState>

          <aside className="budget-page__usage" aria-labelledby="budget-usage-title">
            <h3 id="budget-usage-title">Usage this period</h3>
            {spending.error && <p className="error-message">{spending.error}</p>}
            {rows.length === 0 ? (
              <p className="no-data-message">Set category limits to track usage.</p>
            ) : (
              <div className="budget-page__usage-list">
                {rows.map((row) => (
                  <ProgressBar
                    key={row._id}
                    label={row.categoryName}
                    used={row.spent}
                    total={row.limit}
                    detail={`${formatMoney(row.spent)} / ${formatMoney(row.limit)}`}
                  />
                ))}
              </div>
            )}
          </aside>
        </div>
      </section>

      <CategoryManager
        categories={categoryList}
        loading={categories.loading}
        error={categories.error}
        onReload={categories.reload}
        onChanged={handleCategoriesChanged}
      />

      {/* Monthly budget modal */}
      <Modal
        isOpen={isMonthlyOpen}
        onClose={() => !isSavingMonthly && setIsMonthlyOpen(false)}
        title={monthlyBudget ? 'Edit monthly budget' : 'Create monthly budget'}
      >
        <form onSubmit={handleMonthlySubmit} className="modal-form" noValidate>
          {monthlyError && (
            <p className="error-message" role="alert">
              {monthlyError}
            </p>
          )}
          <div className="form-group">
            <label htmlFor="monthly-amount">Total budget ({currency})</label>
            <input
              id="monthly-amount"
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              className="input-field"
              value={monthlyForm.total_budget_amount}
              onChange={(e) => setMonthlyForm((prev) => ({ ...prev, total_budget_amount: e.target.value }))}
              placeholder="e.g. 2000"
              required
            />
          </div>
          <div className="budget-page__date-row">
            <div className="form-group">
              <label htmlFor="monthly-start">Start date</label>
              <input
                id="monthly-start"
                type="date"
                className="input-field"
                value={monthlyForm.start_date}
                onChange={(e) => setMonthlyForm((prev) => ({ ...prev, start_date: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="monthly-end">End date</label>
              <input
                id="monthly-end"
                type="date"
                className="input-field"
                value={monthlyForm.end_date}
                min={monthlyForm.start_date || undefined}
                onChange={(e) => setMonthlyForm((prev) => ({ ...prev, end_date: e.target.value }))}
                required
              />
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="secondary-button" onClick={() => setIsMonthlyOpen(false)} disabled={isSavingMonthly}>
              Cancel
            </button>
            <button type="submit" className="primary-button" disabled={isSavingMonthly}>
              {isSavingMonthly ? 'Saving…' : monthlyBudget ? 'Save changes' : 'Create budget'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Category limit modal */}
      <Modal
        isOpen={itemModal !== null}
        onClose={() => !isSavingItem && setItemModal(null)}
        title={editingItem ? 'Edit category limit' : 'Add category limit'}
      >
        <form onSubmit={handleItemSubmit} className="modal-form" noValidate>
          {itemError && (
            <p className="error-message" role="alert">
              {itemError}
            </p>
          )}
          <div className="form-group">
            <label htmlFor="item-category">Category</label>
            <select
              id="item-category"
              name="category_id"
              className="select-field"
              value={itemForm.category_id}
              onChange={handleItemChange}
              required
            >
              <option value="" disabled>
                Select a category
              </option>
              {selectableCategories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
            {!editingItem && selectableCategories.length === 0 && (
              <span className="field-hint">Every category already has a limit this month.</span>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="item-limit">Limit ({currency})</label>
            <input
              id="item-limit"
              type="number"
              name="limit_amount"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              className="input-field"
              value={itemForm.limit_amount}
              onChange={handleItemChange}
              placeholder="e.g. 500"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="item-description">Description (optional)</label>
            <textarea
              id="item-description"
              name="description"
              className="textarea-field"
              maxLength={200}
              value={itemForm.description}
              onChange={handleItemChange}
              placeholder="e.g. Weekly groceries"
            />
          </div>
          <div className="form-actions">
            <button type="button" className="secondary-button" onClick={() => setItemModal(null)} disabled={isSavingItem}>
              Cancel
            </button>
            <button type="submit" className="primary-button" disabled={isSavingItem}>
              {isSavingItem ? 'Saving…' : editingItem ? 'Save changes' : 'Add limit'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deletingItem !== null}
        title="Delete category limit"
        message={
          <>
            Remove the limit for <strong>{deletingItem?.categoryName}</strong>? Your expenses are not affected.
          </>
        }
        confirmLabel="Delete limit"
        busy={isDeleting}
        error={deleteError}
        onConfirm={handleDeleteItem}
        onCancel={() => setDeletingItem(null)}
      />
    </AppLayout>
  );
};

export default BudgetManagementPage;
