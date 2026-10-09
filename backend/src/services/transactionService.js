const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const Person = require('../models/Person');
const ApiError = require('../utils/ApiError');
const { oid, escapeRegex } = require('../utils/ownership');
const { parseDay, addDays, monthRange } = require('../utils/dates');

const { TYPES, PAYMENT_METHODS } = Transaction;

exports.populateCategory = { path: 'categoryId', select: 'name icon color' };

/** Flattens a populated transaction: { categoryId: <id>, category: {name, icon, color} } */
exports.shape = (t) => {
  const o = t.toObject ? t.toObject() : t;
  const category = o.categoryId && o.categoryId.name ? o.categoryId : null;
  return { ...o, category, categoryId: o.categoryId?._id || o.categoryId };
};

exports.findOrCreatePerson = async (userId, name) => {
  const existing = await Person.findOne({ userId, name: new RegExp(`^${escapeRegex(name)}$`, 'i') });
  return existing || Person.create({ userId, name });
};

/** Validates ownership of referenced documents and normalises fields by transaction type. */
exports.prepare = async (userId, input) => {
  const data = { ...input };

  if (data.categoryId) {
    if (!(await Category.exists({ _id: data.categoryId, userId }))) throw new ApiError(400, 'Category not found');
  }

  if (data.type === 'sent' || data.type === 'received') {
    data.categoryId = undefined;
    const nameKey = data.type === 'sent' ? 'to' : 'from';
    if (data.personId) {
      const person = await Person.findOne({ _id: data.personId, userId });
      if (!person) throw new ApiError(400, 'Person not found');
      data[nameKey] = person.name;
    } else if (data[nameKey]) {
      data.personId = (await exports.findOrCreatePerson(userId, data[nameKey]))._id;
    }
    data[data.type === 'sent' ? 'from' : 'to'] = undefined;
  } else {
    data.personId = undefined;
    data.from = undefined;
    data.to = undefined;
  }

  data.date = parseDay(data.date);
  return data;
};

exports.buildFilter = (userId, q) => {
  const f = { userId };
  if (TYPES.includes(q.type)) f.type = q.type;
  if (q.categoryId) f.categoryId = oid(q.categoryId);
  if (q.personId) f.personId = oid(q.personId);
  if (PAYMENT_METHODS.includes(q.paymentMethod)) f.paymentMethod = q.paymentMethod;

  if (q.date) {
    const d = parseDay(String(q.date));
    f.date = { $gte: d, $lt: addDays(d, 1) };
  } else if (q.month && q.year) {
    const { start, end } = monthRange(q.year, q.month);
    f.date = { $gte: start, $lt: end };
  } else if (q.from || q.to) {
    f.date = {};
    if (q.from) f.date.$gte = parseDay(String(q.from));
    if (q.to) f.date.$lt = addDays(parseDay(String(q.to)), 1);
  }

  const min = Number(q.minAmount);
  const max = Number(q.maxAmount);
  if (q.minAmount && !Number.isNaN(min)) f.amount = { ...f.amount, $gte: min };
  if (q.maxAmount && !Number.isNaN(max)) f.amount = { ...f.amount, $lte: max };

  if (q.search && String(q.search).trim()) {
    const rx = new RegExp(escapeRegex(String(q.search).trim().slice(0, 60)), 'i');
    f.$or = [{ merchant: rx }, { description: rx }, { from: rx }, { to: rx }, { tags: rx }];
  }
  return f;
};

exports.sortFor = (s) =>
  ({
    oldest: { date: 1, time: 1, createdAt: 1 },
    highest: { amount: -1 },
    lowest: { amount: 1 },
  }[s] || { date: -1, time: -1, createdAt: -1 });
