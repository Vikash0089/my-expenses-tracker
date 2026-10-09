const { Types } = require('mongoose');
const ApiError = require('./ApiError');

const ID_RE = /^[a-f\d]{24}$/i;

/** Validates a string id and returns an ObjectId (throws 400 otherwise). Also blocks query-operator objects. */
exports.oid = (id) => {
  if (typeof id !== 'string' || !ID_RE.test(id)) throw new ApiError(400, 'Invalid id');
  return new Types.ObjectId(id);
};

/** Loads a document only if it belongs to the user. Every per-id lookup goes through here. */
exports.findOwned = async (Model, id, userId, label = 'Record') => {
  const doc = await Model.findOne({ _id: exports.oid(id), userId });
  if (!doc) throw new ApiError(404, `${label} not found`);
  return doc;
};

exports.escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
