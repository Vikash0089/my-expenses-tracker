const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const { monthRange, addDays, effectiveDays } = require('../utils/dates');

const round = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const inRange = (start, end) => ({ $gte: start, $lt: end });
const emptyTotals = () => ({ income: 0, expense: 0, sent: 0, received: 0 });

const derive = (t) => {
  const savings = t.income - t.expense;
  return {
    balance: round(t.income + t.received - t.expense - t.sent),
    savings: round(savings),
    savingsRate: t.income > 0 ? round((savings / t.income) * 100) : 0,
  };
};

/** Income / expense / sent / received totals for a range. */
exports.totalsByType = async (userId, start, end) => {
  const rows = await Transaction.aggregate([
    { $match: { userId, date: inRange(start, end) } },
    { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } },
  ]);
  const totals = emptyTotals();
  let count = 0;
  rows.forEach((r) => {
    totals[r._id] = round(r.total);
    count += r.count;
  });
  return { ...totals, count, ...derive(totals) };
};

/** Per-day totals (only days that have transactions). */
exports.dailyTotals = async (userId, start, end) => {
  const rows = await Transaction.aggregate([
    { $match: { userId, date: inRange(start, end) } },
    {
      $group: {
        _id: { day: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, type: '$type' },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.day': 1 } },
  ]);
  const byDay = new Map();
  rows.forEach(({ _id, total, count }) => {
    const entry = byDay.get(_id.day) || { date: _id.day, ...emptyTotals(), count: 0 };
    entry[_id.type] = round(total);
    entry.count += count;
    byDay.set(_id.day, entry);
  });
  return [...byDay.values()];
};

/** Adds zero-rows for days without transactions so charts get a continuous series. */
exports.fillDays = (days, start, end) => {
  const byDay = new Map(days.map((d) => [d.date, d]));
  const out = [];
  for (let d = new Date(start); d < end; d = addDays(d, 1)) {
    const key = d.toISOString().slice(0, 10);
    out.push(byDay.get(key) || { date: key, ...emptyTotals(), count: 0 });
  }
  return out;
};

const categoryLookup = [
  { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'cat' } },
  { $unwind: { path: '$cat', preserveNullAndEmptyArrays: true } },
  {
    $project: {
      _id: 0,
      categoryId: '$_id',
      name: { $ifNull: ['$cat.name', 'Uncategorized'] },
      icon: { $ifNull: ['$cat.icon', '📦'] },
      color: { $ifNull: ['$cat.color', '#94a3b8'] },
      total: 1,
      count: 1,
    },
  },
  { $sort: { total: -1 } },
];

exports.categoryTotals = async (userId, start, end, type = 'expense') => {
  const rows = await Transaction.aggregate([
    { $match: { userId, type, date: inRange(start, end) } },
    { $group: { _id: '$categoryId', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ...categoryLookup,
  ]);
  const grand = rows.reduce((s, r) => s + r.total, 0);
  return rows.map((r) => ({ ...r, total: round(r.total), percent: grand ? round((r.total / grand) * 100) : 0 }));
};

exports.paymentMethodTotals = async (userId, start, end) => {
  const rows = await Transaction.aggregate([
    { $match: { userId, type: 'expense', date: inRange(start, end) } },
    { $group: { _id: { $ifNull: ['$paymentMethod', 'Other'] }, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    { $project: { _id: 0, method: '$_id', total: 1, count: 1 } },
    { $sort: { total: -1 } },
  ]);
  const grand = rows.reduce((s, r) => s + r.total, 0);
  return rows.map((r) => ({ ...r, total: round(r.total), percent: grand ? round((r.total / grand) * 100) : 0 }));
};

exports.topExpenses = (userId, start, end, limit = 5) =>
  Transaction.aggregate([
    { $match: { userId, type: 'expense', date: inRange(start, end) } },
    { $sort: { amount: -1, date: -1 } },
    { $limit: limit },
    { $lookup: { from: 'categories', localField: 'categoryId', foreignField: '_id', as: 'cat' } },
    { $unwind: { path: '$cat', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        amount: 1, date: 1, merchant: 1, description: 1, paymentMethod: 1,
        category: '$cat.name', icon: '$cat.icon',
      },
    },
  ]);

exports.averageDailySpending = (expenseTotal, start, end) => round(expenseTotal / effectiveDays(start, end));

/** Current vs previous month: totals, % change and category-by-category savings. */
exports.compareMonths = async (userId, year, month) => {
  const prevY = month === 1 ? year - 1 : year;
  const prevM = month === 1 ? 12 : month - 1;
  const cur = monthRange(year, month);
  const prev = monthRange(prevY, prevM);
  const [current, previous, curCats, prevCats] = await Promise.all([
    exports.totalsByType(userId, cur.start, cur.end),
    exports.totalsByType(userId, prev.start, prev.end),
    exports.categoryTotals(userId, cur.start, cur.end),
    exports.categoryTotals(userId, prev.start, prev.end),
  ]);

  const merged = new Map();
  const put = (rows, key) =>
    rows.forEach((r) => {
      const id = String(r.categoryId);
      const e = merged.get(id) || { categoryId: r.categoryId, name: r.name, icon: r.icon, color: r.color, current: 0, previous: 0 };
      e[key] = r.total;
      merged.set(id, e);
    });
  put(curCats, 'current');
  put(prevCats, 'previous');

  const categories = [...merged.values()]
    .map((c) => ({ ...c, saved: round(c.previous - c.current) }))
    .sort((a, b) => Math.max(b.current, b.previous) - Math.max(a.current, a.previous));

  return {
    current: { year, month, ...current },
    previous: { year: prevY, month: prevM, ...previous },
    expenseChange: previous.expense > 0 ? round(((current.expense - previous.expense) / previous.expense) * 100) : null,
    categories,
  };
};

/** Budget progress for one budget document (total + per-category). */
exports.budgetStatus = async (userId, budget) => {
  const { start, end } = monthRange(budget.year, budget.month);
  const rows = await exports.categoryTotals(userId, start, end);
  const spentBy = new Map(rows.map((r) => [String(r.categoryId), r.total]));
  const totalSpent = rows.reduce((s, r) => s + r.total, 0);

  const cats = await Category.find({ _id: { $in: budget.categoryBudgets.map((c) => c.categoryId) }, userId }).lean();
  const catMap = new Map(cats.map((c) => [String(c._id), c]));
  const level = (pct) => (pct > 100 ? 'exceeded' : pct >= 80 ? 'warning' : 'ok');

  const categories = budget.categoryBudgets.map((cb) => {
    const spent = spentBy.get(String(cb.categoryId)) || 0;
    const pct = cb.amount > 0 ? round((spent / cb.amount) * 100) : 0;
    const c = catMap.get(String(cb.categoryId)) || {};
    return {
      categoryId: cb.categoryId, name: c.name || 'Unknown', icon: c.icon || '📦', color: c.color || '#94a3b8',
      budget: cb.amount, spent: round(spent), remaining: round(cb.amount - spent), percentUsed: pct, status: level(pct),
    };
  });
  const pct = budget.totalAmount > 0 ? round((totalSpent / budget.totalAmount) * 100) : 0;
  return {
    totalBudget: budget.totalAmount, totalSpent: round(totalSpent), remaining: round(budget.totalAmount - totalSpent),
    percentUsed: pct, status: level(pct), categories,
  };
};

/** Lending / borrowing balances per person: sent - received. >0 they owe you, <0 you owe them. */
exports.personBalances = async (userId, personId) => {
  const rows = await Transaction.aggregate([
    { $match: { userId, type: { $in: ['sent', 'received'] }, personId: personId || { $ne: null } } },
    { $group: { _id: { personId: '$personId', type: '$type' }, total: { $sum: '$amount' }, count: { $sum: 1 } } },
  ]);
  const map = new Map();
  rows.forEach(({ _id, total, count }) => {
    const key = String(_id.personId);
    const e = map.get(key) || { sent: 0, received: 0, count: 0 };
    e[_id.type] = round(total);
    e.count += count;
    map.set(key, e);
  });
  return map;
};

exports.withBalance = (stats = { sent: 0, received: 0, count: 0 }) => {
  const remaining = round(stats.sent - stats.received);
  return {
    ...stats,
    remaining,
    status: remaining > 0 ? 'owes_you' : remaining < 0 ? 'you_owe' : 'settled',
  };
};

exports.round = round;
