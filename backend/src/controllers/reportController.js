const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok } = require('../utils/response');
const reports = require('../services/reportService');

exports.summary = asyncHandler(async (req, res) => {
  const { range, ...rest } = await reports.generate(req.user._id, req.query);
  ok(res, { ...rest, range: { from: range.from, to: range.to } });
});

exports.exportReport = asyncHandler(async (req, res) => {
  const format = req.query.format;
  if (!['csv', 'pdf'].includes(format)) throw new ApiError(400, 'format must be csv or pdf');
  const report = await reports.generate(req.user._id, req.query);
  const filename = `report-${report.range.from}-to-${report.range.to}.${format}`;
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
  if (format === 'csv') {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    return res.send(await reports.toCsv(req.user._id, report));
  }
  res.setHeader('Content-Type', 'application/pdf');
  return reports.streamPdf(res, req.user._id, report, req.user);
});
