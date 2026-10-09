const mongoose = require('mongoose');

const personSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    phone: { type: String, trim: true, maxlength: 30 },
    notes: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

personSchema.index({ userId: 1, name: 1 });

module.exports = mongoose.model('Person', personSchema);
