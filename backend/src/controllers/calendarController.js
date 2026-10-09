const Transaction = require('../models/Transaction');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/response');
const { monthParams, parseDay, addDays } = require('../utils/dates');
const analytics = require('../services/analyticsService');
const svc = require('../services/transactionService');

exports.month = asyncHandler(async (req, res) => {
  const { year, month, start, end } = monthParams(req.query);
  ok(res, { year, month, days: await analytics.dailyTotals(req.user._id, start, end) });
});

exports.day = asyncHandler(async (req, res) => {
  const start = parseDay(req.params.date);
  const end = addDays(start, 1);
  const [transactions, totals] = await Promise.all([
    Transaction.find({ userId: req.user._id, date: { $gte: start, $lt: end } })
      .sort({ time: 1, createdAt: 1 }).populate(svc.populateCategory).lean(),
    analytics.totalsByType(req.user._id, start, end),
  ]);
  ok(res, {
    date: req.params.date,
    summary: {
      expense: totals.expense, income: totals.income, sent: totals.sent, received: totals.received,
      net: analytics.round(totals.income + totals.received - totals.expense - totals.sent), count: totals.count,
    },
    transactions: transactions.map(svc.shape),
  });
});
