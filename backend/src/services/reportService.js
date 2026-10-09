const PDFDocument = require('pdfkit');
const Transaction = require('../models/Transaction');
const analytics = require('./analyticsService');
const { reportRange, toDayString, addDays } = require('../utils/dates');

exports.generate = async (userId, query) => {
  const { start, end } = reportRange(query);
  const [totals, categories, topExpenses] = await Promise.all([
    analytics.totalsByType(userId, start, end),
    analytics.categoryTotals(userId, start, end),
    analytics.topExpenses(userId, start, end, 5),
  ]);
  return {
    period: query.period || 'monthly',
    range: { from: toDayString(start), to: toDayString(addDays(end, -1)), start, end },
    totals,
    categories,
    topExpenses,
    highestExpense: topExpenses[0] || null,
    highestCategory: categories[0] || null,
    averageDailySpending: analytics.averageDailySpending(totals.expense, start, end),
  };
};

const csvCell = (v) => {
  let s = v == null ? '' : String(v);
  if (/^[=+\-@]/.test(s)) s = `'${s}`; // neutralise spreadsheet formula injection
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const listTransactions = (userId, report) =>
  Transaction.find({ userId, date: { $gte: report.range.start, $lt: report.range.end } })
    .sort({ date: 1, time: 1 })
    .populate('categoryId', 'name')
    .lean();

exports.toCsv = async (userId, report) => {
  const txs = await listTransactions(userId, report);
  const head = ['Date', 'Time', 'Type', 'Amount', 'Category', 'Merchant/Source', 'From', 'To', 'Payment Method', 'Description', 'Tags'];
  const rows = txs.map((t) => [
    toDayString(t.date), t.time, t.type, t.amount, t.categoryId?.name, t.merchant, t.from, t.to,
    t.paymentMethod, t.description, (t.tags || []).join('; '),
  ]);
  return `\uFEFF${[head, ...rows].map((r) => r.map(csvCell).join(',')).join('\n')}\n`;
};

exports.streamPdf = async (res, userId, report, user) => {
  const txs = await listTransactions(userId, report);
  // Built-in PDF fonts have no ₹ glyph, so amounts use the ISO currency code.
  const fmt = (n) => `${user.currency} ${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  doc.pipe(res);

  doc.fontSize(20).fillColor('#0f172a').text('Expense Report');
  doc.fontSize(10).fillColor('#64748b').text(`${user.name}  |  ${report.range.from} to ${report.range.to}`);
  doc.moveDown();

  const t = report.totals;
  doc.fontSize(12).fillColor('#0f172a').text('Summary');
  doc.fontSize(10).fillColor('#334155');
  [
    ['Total income', t.income], ['Total expenses', t.expense], ['Money sent', t.sent], ['Money received', t.received],
    ['Savings (income - expenses)', t.savings], ['Average daily spending', report.averageDailySpending],
  ].forEach(([label, v]) => doc.text(`${label}: ${fmt(v)}`));
  if (report.highestExpense) {
    doc.text(`Highest expense: ${fmt(report.highestExpense.amount)} (${report.highestExpense.merchant || report.highestExpense.category || 'n/a'})`);
  }
  if (report.highestCategory) doc.text(`Highest spending category: ${report.highestCategory.name} (${fmt(report.highestCategory.total)})`);
  doc.moveDown();

  if (report.categories.length) {
    doc.fontSize(12).fillColor('#0f172a').text('Spending by category');
    doc.fontSize(10).fillColor('#334155');
    report.categories.forEach((c) => doc.text(`${c.name}: ${fmt(c.total)} (${c.percent}%)`));
    doc.moveDown();
  }

  doc.fontSize(12).fillColor('#0f172a').text('Transactions');
  doc.moveDown(0.5);
  const cols = [[40, 62], [102, 55], [157, 90], [247, 190], [437, 118]];
  const row = (cells, bold) => {
    if (doc.y > 770) doc.addPage();
    const y = doc.y;
    doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(8.5).fillColor('#334155');
    cells.forEach((c, i) =>
      doc.text(String(c ?? ''), cols[i][0], y, { width: cols[i][1] - 4, lineBreak: false, ellipsis: true, align: i === 4 ? 'right' : 'left' })
    );
    doc.x = 40;
    doc.y = y + 14;
  };
  row(['Date', 'Type', 'Category', 'Details', 'Amount'], true);
  txs.forEach((x) =>
    row([toDayString(x.date), x.type, x.categoryId?.name, x.merchant || x.to || x.from || x.description, fmt(x.amount)])
  );
  if (!txs.length) doc.font('Helvetica').text('No transactions in this period.', 40);
  doc.end();
};
