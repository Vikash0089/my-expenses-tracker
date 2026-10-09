const RecurringTransaction = require('../models/RecurringTransaction');
const Transaction = require('../models/Transaction');
const { addInterval, startOfToday } = require('../utils/dates');

async function run(userId) {
  const today = startOfToday();
  const filter = { active: true, nextDueDate: { $lte: today } };
  if (userId) filter.userId = userId;

  let created = 0;
  const due = await RecurringTransaction.find(filter);
  for (const r of due) {
    const docs = [];
    let next = new Date(r.nextDueDate);
    let guard = 0;
    while (next <= today && (!r.endDate || next <= r.endDate) && guard++ < 366) {
      docs.push({
        userId: r.userId, type: r.type, amount: r.amount, categoryId: r.categoryId, date: new Date(next),
        merchant: r.title, description: `Recurring: ${r.title}`, paymentMethod: r.paymentMethod, recurringId: r._id,
      });
      next = addInterval(next, r.frequency);
    }
    if (docs.length) {
      await Transaction.insertMany(docs);
      created += docs.length;
    }
    r.nextDueDate = next;
    if (r.endDate && next > r.endDate) r.active = false;
    await r.save();
  }
  return created;
}

// Serialise runs so the hourly job and per-login checks never double-post a transaction.
let chain = Promise.resolve();
exports.processDue = (userId) => {
  const result = chain.then(() => run(userId));
  chain = result.catch(() => {});
  return result;
};
