const mongoose = require('mongoose');

const recurringSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true, maxlength: 80 },
    amount: { type: Number, required: true, min: 0.01 },
    type: { type: String, enum: ['expense', 'income'], required: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    paymentMethod: { type: String },
    frequency: { type: String, enum: ['daily', 'weekly', 'monthly', 'yearly'], required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    nextDueDate: { type: Date, required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

recurringSchema.index({ userId: 1, active: 1, nextDueDate: 1 });

module.exports = mongoose.model('RecurringTransaction', recurringSchema);
