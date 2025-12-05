export const exportExpensesToCSV = (expenses = []) => {
  if (!expenses || expenses.length === 0) return;

  const headers = ['Date', 'Category', 'Description', 'Amount'];
  const rows = expenses.map((exp) => {
    const date = exp.expense_date ? new Date(exp.expense_date).toISOString() : '';
    const category = exp.category_id?.name || exp.category || 'Uncategorized';
    const description = exp.description || '';
    const amount = typeof exp.amount === 'number' ? exp.amount : Number(exp.amount) || 0;
    return [date, category, description, amount];
  });

  const escapeCell = (cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`;
  const csvString = [
    headers.map(escapeCell).join(','),
    ...rows.map((row) => row.map(escapeCell).join(',')),
  ].join('\n');

  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'expenses_report.csv';
  link.click();
  URL.revokeObjectURL(url);
};

export default exportExpensesToCSV;
