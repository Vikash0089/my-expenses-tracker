const ApiError = require('./ApiError');

// All dates are stored as UTC midnight of the calendar day the user picked (YYYY-MM-DD),
// so "October 8" is October 8 for everyone regardless of server/browser time zone.
const DAY_MS = 86400000;
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

const parseDay = (str) => {
  if (!DAY_RE.test(str || '')) throw new ApiError(400, 'Date must be in YYYY-MM-DD format');
  const d = new Date(`${str}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) throw new ApiError(400, 'Invalid date');
  return d;
};
const toDayString = (d) => new Date(d).toISOString().slice(0, 10);
const addDays = (d, n) => new Date(new Date(d).getTime() + n * DAY_MS);
const startOfToday = () => parseDay(new Date().toISOString().slice(0, 10));

const monthRange = (year, month) => {
  const y = Number(year);
  const m = Number(month);
  if (!Number.isInteger(y) || !Number.isInteger(m) || m < 1 || m > 12 || y < 1970 || y > 2200) {
    throw new ApiError(400, 'Invalid month or year');
  }
  return { start: new Date(Date.UTC(y, m - 1, 1)), end: new Date(Date.UTC(y, m, 1)) };
};

/** Reads ?month=&year= (defaults to the current month) */
const monthParams = (q) => {
  const now = new Date();
  const year = q.year ? Number(q.year) : now.getUTCFullYear();
  const month = q.month ? Number(q.month) : now.getUTCMonth() + 1;
  return { year, month, ...monthRange(year, month) };
};

const addMonths = (date, n) => {
  const day = date.getUTCDate();
  const r = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + n, 1));
  const last = new Date(Date.UTC(r.getUTCFullYear(), r.getUTCMonth() + 1, 0)).getUTCDate();
  r.setUTCDate(Math.min(day, last));
  return r;
};

const addInterval = (date, frequency) => {
  const d = new Date(date);
  if (frequency === 'daily') return addDays(d, 1);
  if (frequency === 'weekly') return addDays(d, 7);
  if (frequency === 'monthly') return addMonths(d, 1);
  return addMonths(d, 12);
};

/** Half-open [start, end) range for report periods. */
const reportRange = ({ period = 'monthly', date, from, to }) => {
  const base = date ? parseDay(String(date)) : startOfToday();
  const y = base.getUTCFullYear();
  switch (period) {
    case 'daily':
      return { start: base, end: addDays(base, 1) };
    case 'weekly': {
      const start = addDays(base, -((base.getUTCDay() + 6) % 7)); // Monday
      return { start, end: addDays(start, 7) };
    }
    case 'monthly':
      return monthRange(y, base.getUTCMonth() + 1);
    case 'yearly':
      return { start: new Date(Date.UTC(y, 0, 1)), end: new Date(Date.UTC(y + 1, 0, 1)) };
    case 'custom': {
      const s = parseDay(String(from || ''));
      const e = parseDay(String(to || ''));
      if (e < s) throw new ApiError(400, 'End date must be after start date');
      if ((e - s) / DAY_MS > 3660) throw new ApiError(400, 'Date range is too large');
      return { start: s, end: addDays(e, 1) };
    }
    default:
      throw new ApiError(400, 'Invalid period');
  }
};

/** Days in range that have actually elapsed (so averages for the current month aren't diluted). */
const effectiveDays = (start, end) => {
  const tomorrow = addDays(startOfToday(), 1);
  const upper = end > tomorrow && start < tomorrow ? tomorrow : end;
  return Math.max(1, Math.round((upper - start) / DAY_MS));
};

module.exports = {
  DAY_MS, parseDay, toDayString, addDays, startOfToday, monthRange, monthParams,
  addInterval, reportRange, effectiveDays,
};
