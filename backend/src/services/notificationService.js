const Budget = require('../models/Budget');
const SavingsGoal = require('../models/SavingsGoal');
const RecurringTransaction = require('../models/RecurringTransaction');
const analytics = require('./analyticsService');
const { formatMoney } = require('../utils/money');
const { monthRange, startOfToday, addDays, DAY_MS } = require('../utils/dates');

exports.build = async (user) => {
  const userId = user._id;
  const cur = (n) => formatMoney(n, user.currency);
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  const items = [];

  // Budgets
  const budget = await Budget.findOne({ userId, year, month }).lean();
  if (budget) {
    const s = await analytics.budgetStatus(userId, budget);
    if (s.status === 'exceeded') items.push({ id: 'budget-total', level: 'danger', message: `⚠️ Your monthly budget has been exceeded (${cur(s.totalSpent)} of ${cur(s.totalBudget)}).` });
    else if (s.status === 'warning') items.push({ id: 'budget-total', level: 'warning', message: `⚠️ Your monthly budget is ${Math.round(s.percentUsed)}% used.` });
    s.categories.forEach((c) => {
      if (c.status === 'exceeded') items.push({ id: `budget-${c.categoryId}`, level: 'danger', message: `⚠️ ${c.name} budget exceeded by ${cur(-c.remaining)}.` });
      else if (c.status === 'warning') items.push({ id: `budget-${c.categoryId}`, level: 'warning', message: `⚠️ ${c.name} budget is ${Math.round(c.percentUsed)}% used.` });
    });
  }

  // Recurring payments due soon (they post automatically on the due date)
  const today = startOfToday();
  const upcoming = await RecurringTransaction.find({ userId, active: true, nextDueDate: { $gt: today, $lte: addDays(today, 3) } }).lean();
  upcoming.forEach((r) => {
    const days = Math.round((r.nextDueDate - today) / DAY_MS);
    items.push({ id: `rec-${r._id}`, level: 'info', message: `🔔 ${r.title} (${cur(r.amount)}) is due ${days === 1 ? 'tomorrow' : `in ${days} days`}.` });
  });

  // Spending vs last month
  const { current, previous } = await analytics.compareMonths(userId, year, month);
  if (previous.expense > 0 && current.expense < previous.expense) {
    const pct = Math.round(((previous.expense - current.expense) / previous.expense) * 100);
    if (pct >= 5 && now.getUTCDate() >= 7) items.push({ id: 'less-spend', level: 'success', message: `🎉 You spent ${pct}% less than last month.` });
  }

  // Savings goals close to target
  const goals = await SavingsGoal.find({ userId }).lean();
  goals.forEach((g) => {
    const remaining = g.targetAmount - g.currentAmount;
    if (remaining > 0 && remaining / g.targetAmount <= 0.15) {
      items.push({ id: `goal-${g._id}`, level: 'success', message: `🎯 You are ${cur(remaining)} away from your "${g.name}" goal.` });
    }
  });

  const order = { danger: 0, warning: 1, info: 2, success: 3 };
  return items.sort((a, b) => order[a.level] - order[b.level]);
};
