const Category = require('../models/Category');

const DEFAULTS = [
  ['Food', '🍔', '#ef4444'], ['Travel', '🚕', '#f59e0b'], ['Shopping', '🛍️', '#ec4899'],
  ['Rent', '🏠', '#8b5cf6'], ['Bills', '💡', '#0ea5e9'], ['Health', '🩺', '#10b981'],
  ['Education', '📚', '#6366f1'], ['Entertainment', '🎬', '#f97316'], ['Clothing', '👕', '#d946ef'],
  ['Investment', '📈', '#14b8a6'], ['Subscription', '🔁', '#64748b'], ['Salary', '💰', '#22c55e'],
  ['Other', '📦', '#94a3b8'],
];

exports.seedDefaults = (userId) =>
  Category.insertMany(DEFAULTS.map(([name, icon, color]) => ({ userId, name, icon, color, isDefault: true })));
