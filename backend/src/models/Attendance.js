const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const STATUSES = ['present', 'absent', 'late'];

const attendanceSchema = new mongoose.Schema(
  {
    student: { type: ObjectId, ref: 'Student', required: true },
    class: { type: ObjectId, ref: 'Class', required: true },
    date: { type: Date, required: true }, // always stored as 00:00 UTC of that day
    status: { type: String, enum: STATUSES, required: true },
    markedBy: { type: ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// One row per student per day. Saving again for the same day updates it (upsert).
attendanceSchema.index({ student: 1, date: 1 }, { unique: true });
attendanceSchema.index({ class: 1, date: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
module.exports.STATUSES = STATUSES;
