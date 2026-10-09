const Category = require('../models/Category');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const ApiError = require('../utils/ApiError');
const crud = require('./crudFactory');

module.exports = crud({
  Model: Category,
  label: 'Category',
  sort: { name: 1 },
  prepare: async (_userId, body) => body,
  beforeRemove: async (userId, doc) => {
    if (await Transaction.exists({ userId, categoryId: doc._id })) {
      throw new ApiError(409, 'This category has transactions. Re-categorise or delete them first.');
    }
    await Budget.updateMany({ userId }, { $pull: { categoryBudgets: { categoryId: doc._id } } });
  },
});
