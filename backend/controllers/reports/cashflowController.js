const Expense = require('../../models/Expense');
const mongoose = require('mongoose');
const { startOfMonth, endOfDay } = require('date-fns');

const parseDate = (value, fallback) => {
  if (!value) return fallback;
  const d = new Date(value);
  return isNaN(d.getTime()) ? fallback : d;
};

const getCashflow = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, data: null, message: 'User not authenticated' });

    const now = new Date();
    const from = parseDate(req.query.from, startOfMonth(now));
    const to = parseDate(req.query.to, endOfDay(now));
    const account = req.query.account;

    const match = {
      user_id: new mongoose.Types.ObjectId(userId),
      expense_date: { $gte: from, $lte: to },
    };
    if (account) {
      match.account = account;
    }

    const expenses = await Expense.find(match)
      .populate('category_id', 'name')
      .sort({ expense_date: 1, created_at: 1 })
      .lean();

    let inflow = 0;
    let outflow = 0;
    const byCategoryMap = {};
    const runningBalance = [];
    let balance = 0;

    expenses.forEach((item) => {
      const amount = item.amount || 0;
      const type = item.type === 'credit' ? 'credit' : 'debit';
      const signed = type === 'credit' ? amount : -amount;
      if (type === 'credit') inflow += amount; else outflow += amount;

      const categoryName = item.category_id?.name || 'Uncategorized';
      byCategoryMap[categoryName] = byCategoryMap[categoryName] || 0;
      if (type === 'debit') {
        byCategoryMap[categoryName] += amount;
      }

      balance += signed;
      runningBalance.push({
        date: item.expense_date,
        type,
        account: item.account || 'General',
        amount,
        balance,
        category: categoryName,
        description: item.description,
      });
    });

    const byCategory = Object.entries(byCategoryMap).map(([category, total]) => ({ category, total }));
    const net = inflow - outflow;

    return res.status(200).json({
      success: true,
      data: { inflow, outflow, net, byCategory, runningBalance },
      message: 'Cash flow calculated',
    });
  } catch (error) {
    console.error('Error generating cashflow report:', error);
    return res.status(500).json({ success: false, data: null, message: 'Server error while generating cashflow' });
  }
};

module.exports = { getCashflow };
