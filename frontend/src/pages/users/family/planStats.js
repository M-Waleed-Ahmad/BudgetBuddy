export const UNCATEGORIZED_ID = 'uncategorized';
export const UNCATEGORIZED_LABEL = 'Uncategorized';

export const categoryKey = (expense) => (expense?.category?._id ? String(expense.category._id) : UNCATEGORIZED_ID);
export const categoryName = (expense) => expense?.category?.name || UNCATEGORIZED_LABEL;

/**
 * Totals for a list of family expenses. Only approved expenses count toward the
 * plan; pending ones are reported separately and rejected ones are ignored.
 */
export function summarizeExpenses(expenses = []) {
  const spentByCategory = {};
  let approvedTotal = 0;
  let pendingTotal = 0;
  let pendingCount = 0;

  expenses.forEach((expense) => {
    const amount = Number(expense.amount) || 0;
    if (expense.status === 'approved') {
      approvedTotal += amount;
      const key = categoryKey(expense);
      spentByCategory[key] = (spentByCategory[key] || 0) + amount;
    } else if (expense.status === 'pending') {
      pendingTotal += amount;
      pendingCount += 1;
    }
  });

  return { approvedTotal, pendingTotal, pendingCount, spentByCategory };
}

/**
 * Merges the plan's category limits with approved spending. Categories that have
 * spending but no limit (including uncategorized expenses) are listed too.
 */
export function buildCategoryRows(categoryBudgets = [], expenses = []) {
  const names = {};
  expenses.forEach((expense) => {
    names[categoryKey(expense)] = categoryName(expense);
  });

  const { spentByCategory } = summarizeExpenses(expenses);
  const rows = categoryBudgets.map((budget) => {
    const id = String(budget.categoryId);
    return {
      id,
      name: budget.categoryName || names[id] || UNCATEGORIZED_LABEL,
      limit: Number(budget.limitAmount) || 0,
      spent: spentByCategory[id] || 0,
    };
  });

  const listed = new Set(rows.map((row) => row.id));
  Object.entries(spentByCategory).forEach(([id, spent]) => {
    if (!listed.has(id)) rows.push({ id, name: names[id] || UNCATEGORIZED_LABEL, limit: 0, spent });
  });

  return rows.sort((a, b) => b.limit - a.limit || b.spent - a.spent || a.name.localeCompare(b.name));
}
