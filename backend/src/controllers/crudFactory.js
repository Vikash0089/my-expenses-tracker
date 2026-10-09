const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/response');
const { findOwned } = require('../utils/ownership');

/**
 * Generic user-scoped CRUD. Every query is filtered by userId, so users can only
 * ever read or change their own documents.
 *  prepare(userId, body, existingDoc?) -> fields to persist
 *  beforeRemove(userId, doc)           -> may throw to block deletion
 */
module.exports = ({ Model, label, prepare, beforeRemove, sort = { createdAt: -1 } }) => ({
  list: asyncHandler(async (req, res) => {
    ok(res, await Model.find({ userId: req.user._id }).sort(sort).lean());
  }),

  get: asyncHandler(async (req, res) => {
    ok(res, await findOwned(Model, req.params.id, req.user._id, label));
  }),

  create: asyncHandler(async (req, res) => {
    const data = prepare ? await prepare(req.user._id, req.body) : req.body;
    ok(res, await Model.create({ ...data, userId: req.user._id }), 201);
  }),

  update: asyncHandler(async (req, res) => {
    const doc = await findOwned(Model, req.params.id, req.user._id, label);
    doc.set(prepare ? await prepare(req.user._id, req.body, doc) : req.body);
    ok(res, await doc.save());
  }),

  remove: asyncHandler(async (req, res) => {
    const doc = await findOwned(Model, req.params.id, req.user._id, label);
    if (beforeRemove) await beforeRemove(req.user._id, doc);
    await doc.deleteOne();
    ok(res, { id: doc._id });
  }),
});
