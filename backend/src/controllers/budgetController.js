const Budget = require('../models/Budget');
const Category = require('../models/Category');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/response');
const { findOwned } = require('../utils/ownership');
const analytics = require('../services/analyticsService');

const withStatus = async (userId, budget) => ({ ...(budget.toObject ? budget.toObject() : budget), status: await analytics.budgetStatus(userId, budget) });

async function checkCategories(userId, categoryBudgets) {
  const ids = [...new Set(categoryBudgets.map((c) => c.categoryId))];
  if (ids.length !== categoryBudgets.length) throw new ApiError(400, 'Each category can only appear once in a budget');
  if ((await Category.countDocuments({ userId, _id: { $in: ids } })) !== ids.length) throw new ApiError(400, 'One or more categories were not found');
}

exports.list = asyncHandler(async (req, res) => {
  const filter = { userId: req.user._id };
  if (req.query.month) filter.month = Number(req.query.month);
  if (req.query.year) filter.year = Number(req.query.year);
  const budgets = await Budget.find(filter).sort({ year: -1, month: -1 }).lean();
  ok(res, await Promise.all(budgets.map((b) => withStatus(req.user._id, b))));
});

// One budget per month: posting again for the same month updates it.
exports.create = asyncHandler(async (req, res) => {
  const { month, year, totalAmount, categoryBudgets } = req.body;
  await checkCategories(req.user._id, categoryBudgets);
  const budget = await Budget.findOneAndUpdate(
    { userId: req.user._id, year, month },
    { $set: { totalAmount, categoryBudgets } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  ok(res, await withStatus(req.user._id, budget), 201);
});

exports.update = asyncHandler(async (req, res) => {
  const budget = await findOwned(Budget, req.params.id, req.user._id, 'Budget');
  await checkCategories(req.user._id, req.body.categoryBudgets);
  budget.set({ totalAmount: req.body.totalAmount, categoryBudgets: req.body.categoryBudgets });
  await budget.save();
  ok(res, await withStatus(req.user._id, budget));
});

exports.remove = asyncHandler(async (req, res) => {
  const budget = await findOwned(Budget, req.params.id, req.user._id, 'Budget');
  await budget.deleteOne();
  ok(res, { id: budget._id });
});
