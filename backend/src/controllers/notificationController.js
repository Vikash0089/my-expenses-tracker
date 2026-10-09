const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/response');
const { build } = require('../services/notificationService');

exports.list = asyncHandler(async (req, res) => ok(res, await build(req.user)));
