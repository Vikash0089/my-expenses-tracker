const mongoose = require('mongoose');

const TYPES = ['expense', 'income', 'sent', 'received'];
const PAYMENT_METHODS = ['UPI', 'Cash', 'Card', 'Bank Transfer', 'Wallet', 'Other'];

const transactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: TYPES, required: true },
    amount: { type: Number, required: true, min: 0.01 },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    personId: { type: mongoose.Schema.Types.ObjectId, ref: 'Person' },
    date: { type: Date, required: true },
    time: { type: String, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
    from: { type: String, trim: true, maxlength: 100 },
    to: { type: String, trim: true, maxlength: 100 },
    merchant: { type: String, trim: true, maxlength: 100 },
    paymentMethod: { type: String, enum: PAYMENT_METHODS },
    description: { type: String, trim: true, maxlength: 500 },
    receiptUrl: { type: String, trim: true, maxlength: 500 },
    tags: { type: [String], default: [] },
    recurringId: { type: mongoose.Schema.Types.ObjectId, ref: 'RecurringTransaction' },
  },
  { timestamps: true }
);

transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, type: 1, date: -1 });
transactionSchema.index({ userId: 1, categoryId: 1, date: -1 });
transactionSchema.index({ userId: 1, personId: 1 });

const Transaction = mongoose.model('Transaction', transactionSchema);
Transaction.TYPES = TYPES;
Transaction.PAYMENT_METHODS = PAYMENT_METHODS;
module.exports = Transaction;
