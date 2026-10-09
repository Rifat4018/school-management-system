const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    employeeId: { type: String, required: [true, 'Employee ID is required'], unique: true, trim: true },
    specialization: { type: String, trim: true },
    qualification: { type: String, trim: true },
    phone: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Teacher', teacherSchema);
