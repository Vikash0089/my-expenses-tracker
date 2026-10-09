const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/response');
const { seedDefaults } = require('../services/categoryService');
const { processDue } = require('../services/recurringService');

const sign = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

exports.register = asyncHandler(async (req, res) => {
  if (await User.exists({ email: req.body.email })) throw new ApiError(409, 'An account with this email already exists');
  const user = await User.create(req.body);
  await seedDefaults(user._id);
  ok(res, { user, token: sign(user._id) }, 201);
});

exports.login = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email }).select('+password');
  if (!user || !(await user.matchPassword(req.body.password))) throw new ApiError(401, 'Invalid email or password');
  ok(res, { user, token: sign(user._id) });
});

exports.me = asyncHandler(async (req, res) => {
  await processDue(req.user._id).catch((e) => console.error('Recurring processing failed', e));
  ok(res, { user: req.user });
});

exports.updateMe = asyncHandler(async (req, res) => {
  if (req.body.name) req.user.name = req.body.name;
  if (req.body.currency) req.user.currency = req.body.currency;
  await req.user.save();
  ok(res, { user: req.user });
});
