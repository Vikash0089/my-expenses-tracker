export const pad = (n) => String(n).padStart(2, '0');

const locale = (c) => (c === 'INR' ? 'en-IN' : 'en-US');
export const money = (n, currency = 'INR') =>
  new Intl.NumberFormat(locale(currency), { style: 'currency', currency, maximumFractionDigits: 2, minimumFractionDigits: 0 }).format(n || 0);
export const compactMoney = (n, currency = 'INR') =>
  new Intl.NumberFormat(locale(currency), { style: 'currency', currency, notation: 'compact', maximumFractionDigits: 1 }).format(n || 0);

// Dates travel as 'YYYY-MM-DD' strings; they are parsed as *local* dates for display.
export const toDayStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayStr = () => toDayStr(new Date());
export const parseDay = (s) => {
  const [y, m, d] = String(s).slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
};
export const formatDate = (s) => parseDay(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
export const formatShortDate = (s) => parseDay(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
export const formatLongDate = (s) => parseDay(s).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
export const monthLabel = (y, m) => new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
export const monthShort = (y, m) => new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'short' });
export const formatTime = (t) => {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  return `${pad(h % 12 || 12)}:${pad(m)} ${h >= 12 ? 'PM' : 'AM'}`;
};
export const nowTime = () => {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
export const dayUrl = (s) => {
  const [y, m, d] = s.split('-');
  return `/calendar/${y}/${m}/${d}`;
};
