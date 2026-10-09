const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const EXAMS = ['Class Test', 'Midterm', 'Final'];

const resultSchema = new mongoose.Schema(
  {
    student: { type: ObjectId, ref: 'Student', required: true },
    subject: { type: ObjectId, ref: 'Subject', required: true },
    exam: { type: String, enum: EXAMS, required: true },
    marks: { type: Number, required: true, min: 0 },
    totalMarks: { type: Number, default: 100, min: 1 },
    enteredBy: { type: ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// One mark per student, per subject, per exam.
resultSchema.index({ student: 1, subject: 1, exam: 1 }, { unique: true });

module.exports = mongoose.model('Result', resultSchema);
module.exports.EXAMS = EXAMS;
