import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const formatCurrency = (amount) => {
  const num = typeof amount === 'number' ? amount : Number(amount) || 0;
  return num.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

export const exportExpensesToPDF = async (expenses = []) => {
  if (!expenses || expenses.length === 0) return;

  const totalSpent = expenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);

  // Build a temporary container to render for PDF capture
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '800px';
  container.style.padding = '16px';
  container.style.background = '#ffffff';
  container.style.color = '#0f172a';
  container.style.fontFamily = 'Arial, sans-serif';

  const title = document.createElement('h2');
  title.textContent = 'Expense Report';
  title.style.margin = '0 0 8px';
  container.appendChild(title);

  const total = document.createElement('p');
  total.textContent = `Total Spending: ${formatCurrency(totalSpent)}`;
  total.style.margin = '0 0 12px';
  total.style.fontWeight = '600';
  container.appendChild(total);

  const table = document.createElement('table');
  table.style.width = '100%';
  table.style.borderCollapse = 'collapse';
  table.style.fontSize = '12px';

  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  ['Date', 'Category', 'Description', 'Amount'].forEach((h) => {
    const th = document.createElement('th');
    th.textContent = h;
    th.style.border = '1px solid #e2e8f0';
    th.style.padding = '6px';
    th.style.textAlign = 'left';
    th.style.background = '#f8fafc';
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  expenses.forEach((exp) => {
    const tr = document.createElement('tr');
    const date = exp.expense_date ? new Date(exp.expense_date).toLocaleDateString() : '';
    const category = exp.category_id?.name || exp.category || 'Uncategorized';
    const description = exp.description || '';
    const amount = formatCurrency(exp.amount);

    [date, category, description, amount].forEach((cell) => {
      const td = document.createElement('td');
      td.textContent = cell;
      td.style.border = '1px solid #e2e8f0';
      td.style.padding = '6px';
      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });
  table.appendChild(tbody);

  container.appendChild(table);
  document.body.appendChild(container);

  const canvas = await html2canvas(container, { scale: 2 });
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'pt', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 24;
  const imgWidth = pageWidth - margin * 2;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  const startY = 40;

  pdf.text('Expense Report', margin, 24);
  pdf.addImage(imgData, 'PNG', margin, startY, imgWidth, imgHeight);
  pdf.save('expenses_report.pdf');

  document.body.removeChild(container);
};

export default exportExpensesToPDF;
