const formatters = new Map();

/** Formats an amount for notification text, e.g. formatMoney(2500, 'PKR') -> "PKR 2,500.00". */
function formatMoney(amount, currency = 'USD') {
  if (!formatters.has(currency)) {
    formatters.set(currency, new Intl.NumberFormat('en-US', { style: 'currency', currency }));
  }
  return formatters.get(currency).format(amount);
}

module.exports = { formatMoney };
