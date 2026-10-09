const Transaction = require('../models/Transaction');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/response');
const { oid, findOwned } = require('../utils/ownership');
const svc = require('../services/transactionService');
const { getCloudinary, isCloudinaryConfigured } = require('../config/cloudinary');

// fields cleared on update when omitted, so PUT behaves as a full replace
const OPTIONAL = ['categoryId', 'personId', 'from', 'to', 'merchant', 'paymentMethod', 'description', 'receiptUrl', 'time'];
const cleared = () => Object.fromEntries(OPTIONAL.map((k) => [k, undefined]));

exports.list = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const filter = svc.buildFilter(req.user._id, req.query);
  const [items, total] = await Promise.all([
    Transaction.find(filter).sort(svc.sortFor(req.query.sort)).skip((page - 1) * limit).limit(limit)
      .populate(svc.populateCategory).lean(),
    Transaction.countDocuments(filter),
  ]);
  ok(res, items.map(svc.shape), 200, { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) });
});

exports.get = asyncHandler(async (req, res) => {
  const tx = await Transaction.findOne({ _id: oid(req.params.id), userId: req.user._id }).populate(svc.populateCategory).lean();
  if (!tx) throw new ApiError(404, 'Transaction not found');
  ok(res, svc.shape(tx));
});

exports.create = asyncHandler(async (req, res) => {
  const data = await svc.prepare(req.user._id, req.body);
  const tx = await Transaction.create({ ...data, userId: req.user._id });
  await tx.populate(svc.populateCategory);
  ok(res, svc.shape(tx), 201);
});

exports.update = asyncHandler(async (req, res) => {
  const tx = await findOwned(Transaction, req.params.id, req.user._id, 'Transaction');
  tx.set({ ...cleared(), ...(await svc.prepare(req.user._id, req.body)) });
  await tx.save();
  await tx.populate(svc.populateCategory);
  ok(res, svc.shape(tx));
});

exports.remove = asyncHandler(async (req, res) => {
  const tx = await findOwned(Transaction, req.params.id, req.user._id, 'Transaction');
  await tx.deleteOne();
  ok(res, { id: tx._id });
});

exports.uploadReceipt = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'Attach a file in the "receipt" field');
  if (!isCloudinaryConfigured()) {
    throw new ApiError(503, 'Receipt uploads are not configured. Add your Cloudinary credentials to backend/.env.');
  }
  const cloudinary = getCloudinary();
  const result = await new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder: `expense-tracker/${req.user._id}`, resource_type: 'auto' }, (err, r) => (err ? reject(err) : resolve(r)))
      .end(req.file.buffer);
  });
  ok(res, { url: result.secure_url, publicId: result.public_id }, 201);
});
