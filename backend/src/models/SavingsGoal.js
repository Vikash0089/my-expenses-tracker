const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    targetAmount: { type: Number, required: true, min: 1 },
    currentAmount: { type: Number, default: 0, min: 0 },
    targetDate: { type: Date },
    notes: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

goalSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('SavingsGoal', goalSchema);
