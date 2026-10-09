export const TYPES = {
  expense:  { key: 'expense',  label: 'Expense',  sign: '-', text: 'text-red-600 dark:text-red-400',       bg: 'bg-red-500',    soft: 'bg-red-50 dark:bg-red-500/10',       hex: '#ef4444' },
  income:   { key: 'income',   label: 'Income',   sign: '+', text: 'text-green-600 dark:text-green-400',   bg: 'bg-green-500',  soft: 'bg-green-50 dark:bg-green-500/10',   hex: '#22c55e' },
  sent:     { key: 'sent',     label: 'Sent',     sign: '-', text: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500', soft: 'bg-orange-50 dark:bg-orange-500/10', hex: '#f97316' },
  received: { key: 'received', label: 'Received', sign: '+', text: 'text-blue-600 dark:text-blue-400',     bg: 'bg-blue-500',   soft: 'bg-blue-50 dark:bg-blue-500/10',     hex: '#3b82f6' },
};
export const TYPE_LIST = Object.values(TYPES);
export const PAYMENT_METHODS = ['UPI', 'Cash', 'Card', 'Bank Transfer', 'Wallet', 'Other'];
export const CURRENCIES = ['INR', 'USD', 'EUR'];
export const FREQUENCIES = ['daily', 'weekly', 'monthly', 'yearly'];
export const PERIODS = ['daily', 'weekly', 'monthly', 'yearly', 'custom'];
export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
