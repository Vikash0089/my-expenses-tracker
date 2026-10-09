const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/response');
const { monthParams } = require('../utils/dates');
const analytics = require('../services/analyticsService');

exports.summary = asyncHandler(async (req, res) => {
  const { year, month, start, end } = monthParams(req.query);
  ok(res, { year, month, ...(await analytics.totalsByType(req.user._id, start, end)) });
});

exports.monthly = asyncHandler(async (req, res) => {
  const { year, month } = monthParams(req.query);
  ok(res, await analytics.compareMonths(req.user._id, year, month));
});

exports.daily = asyncHandler(async (req, res) => {
  const { start, end } = monthParams(req.query);
  const days = await analytics.dailyTotals(req.user._id, start, end);
  ok(res, analytics.fillDays(days, start, end));
});

exports.categories = asyncHandler(async (req, res) => {
  const { start, end } = monthParams(req.query);
  ok(res, await analytics.categoryTotals(req.user._id, start, end, req.query.type === 'income' ? 'income' : 'expense'));
});

exports.paymentMethods = asyncHandler(async (req, res) => {
  const { start, end } = monthParams(req.query);
  ok(res, await analytics.paymentMethodTotals(req.user._id, start, end));
});
