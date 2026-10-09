const SavingsGoal = require('../models/SavingsGoal');
const { parseDay } = require('../utils/dates');
const crud = require('./crudFactory');

module.exports = crud({
  Model: SavingsGoal,
  label: 'Savings goal',
  prepare: async (_userId, b) => ({ ...b, targetDate: b.targetDate ? parseDay(b.targetDate) : undefined }),
});
