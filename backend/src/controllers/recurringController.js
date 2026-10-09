const RecurringTransaction = require('../models/RecurringTransaction');
const Category = require('../models/Category');
const ApiError = require('../utils/ApiError');
const { parseDay } = require('../utils/dates');
const { processDue } = require('../services/recurringService');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/response');
const crud = require('./crudFactory');

const base = crud({
  Model: RecurringTransaction,
  label: 'Recurring transaction',
  sort: { nextDueDate: 1 },
  prepare: async (userId, b, existing) => {
    if (b.categoryId && !(await Category.exists({ _id: b.categoryId, userId }))) throw new ApiError(400, 'Category not found');
    if (b.type === 'expense' && !b.categoryId) throw new ApiError(400, 'Category is required for expenses');
    const startDate = parseDay(b.startDate);
    const endDate = b.endDate ? parseDay(b.endDate) : undefined;
    if (endDate && endDate < startDate) throw new ApiError(400, 'End date must be after the start date');
    const startChanged = !existing || existing.startDate.getTime() !== startDate.getTime();
    return {
      ...b, startDate, endDate, categoryId: b.categoryId || undefined,
      nextDueDate: startChanged ? startDate : existing.nextDueDate,
      active: b.active ?? existing?.active ?? true,
    };
  },
});

exports.list = asyncHandler(async (req, res) => {
  await processDue(req.user._id); // make sure anything already due has been posted
  ok(res, await RecurringTransaction.find({ userId: req.user._id }).sort({ nextDueDate: 1 }).populate('categoryId', 'name icon').lean());
});
exports.create = asyncHandler(async (req, res, next) => { await base.create(req, res, next); processDue(req.user._id).catch(() => {}); });
exports.get = base.get;
exports.update = base.update;
exports.remove = base.remove;
