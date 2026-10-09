const mongoose = require('mongoose');

const feeSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: [true, 'Student is required'] },
    title: { type: String, required: [true, 'Title is required'], trim: true }, // e.g. "Tuition Fee - October"
    amount: { type: Number, required: [true, 'Amount is required'], min: [0, 'Amount cannot be negative'] },
    dueDate: Date,
    status: { type: String, enum: ['unpaid', 'paid'], default: 'unpaid' },
    paidAt: Date,
  },
  { timestamps: true }
);

feeSchema.index({ student: 1, status: 1 });

module.exports = mongoose.model('Fee', feeSchema);
