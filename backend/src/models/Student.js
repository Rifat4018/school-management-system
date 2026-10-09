const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const studentSchema = new mongoose.Schema(
  {
    user: { type: ObjectId, ref: 'User', required: true, unique: true }, // one-to-one
    class: { type: ObjectId, ref: 'Class', required: [true, 'Class is required'] }, // many-to-one
    rollNo: { type: Number, required: [true, 'Roll number is required'], min: 1 },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    dateOfBirth: Date,
    guardianName: { type: String, trim: true },
    guardianPhone: { type: String, trim: true },
    address: { type: String, trim: true },
  },
  { timestamps: true }
);

// A roll number can be used only once inside the same class.
studentSchema.index({ class: 1, rollNo: 1 }, { unique: true });

module.exports = mongoose.model('Student', studentSchema);
