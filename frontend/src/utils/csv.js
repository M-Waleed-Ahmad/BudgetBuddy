function escapeCell(value) {
  if (value === null || value === undefined) return '';
  const text = String(value);
  // Quote cells containing separators/quotes/newlines and neutralise spreadsheet formulas.
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

/** Builds a CSV string from a header row and data rows (arrays of cell values). */
export function toCsv(headers, rows) {
  return [headers, ...rows].map((row) => row.map(escapeCell).join(',')).join('\r\n');
}

/** Triggers a browser download of `rows` as a UTF-8 CSV file. */
export function downloadCsv(filename, headers, rows) {
  // Prefix a byte-order mark so Excel detects UTF-8.
  const BOM = String.fromCharCode(0xfeff);
  const blob = new Blob([BOM + toCsv(headers, rows)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
