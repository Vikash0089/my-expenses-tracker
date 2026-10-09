const Person = require('../models/Person');
const Transaction = require('../models/Transaction');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/response');
const { findOwned } = require('../utils/ownership');
const analytics = require('../services/analyticsService');
const svc = require('../services/transactionService');
const crud = require('./crudFactory');

const base = crud({
  Model: Person,
  label: 'Person',
  beforeRemove: (userId, doc) => Transaction.updateMany({ userId, personId: doc._id }, { $unset: { personId: 1 } }),
});

exports.create = base.create;
exports.update = base.update;
exports.remove = base.remove;

exports.list = asyncHandler(async (req, res) => {
  const [people, balances] = await Promise.all([
    Person.find({ userId: req.user._id }).sort({ name: 1 }).lean(),
    analytics.personBalances(req.user._id),
  ]);
  const list = people.map((p) => ({ ...p, ...analytics.withBalance(balances.get(String(p._id))) }));
  const summary = {
    toReceive: analytics.round(list.filter((p) => p.remaining > 0).reduce((s, p) => s + p.remaining, 0)),
    toPay: analytics.round(list.filter((p) => p.remaining < 0).reduce((s, p) => s - p.remaining, 0)),
  };
  ok(res, { people: list, summary });
});

exports.get = asyncHandler(async (req, res) => {
  const person = await findOwned(Person, req.params.id, req.user._id, 'Person');
  const [balances, transactions] = await Promise.all([
    analytics.personBalances(req.user._id, person._id),
    Transaction.find({ userId: req.user._id, personId: person._id }).sort({ date: -1, time: -1 }).limit(300)
      .populate(svc.populateCategory).lean(),
  ]);
  ok(res, {
    person: { ...person.toObject(), ...analytics.withBalance(balances.get(String(person._id))) },
    transactions: transactions.map(svc.shape),
  });
});
