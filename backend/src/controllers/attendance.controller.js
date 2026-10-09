const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { dayStart } = require('../utils/helpers');
const { resolveStudentId } = require('../utils/scope');

const { STATUSES } = Attendance;

// GET /api/attendance?class=<id>&date=YYYY-MM-DD  -> the class register for one day
exports.getRegister = asyncHandler(async (req, res) => {
  const { class: classId, date } = req.query;
  if (typeof classId !== 'string' || !classId) throw new ApiError(400, 'class is required');
  const day = dayStart(date);

  const students = await Student.find({ class: classId }).populate('user', 'name').sort('rollNo');
  const marked = await Attendance.find({ student: { $in: students.map((s) => s._id) }, date: day });
  const statusOf = new Map(marked.map((a) => [String(a.student), a.status]));

  res.json({
    success: true,
    data: students.map((s) => ({
      student: s._id,
      rollNo: s.rollNo,
      name: s.user ? s.user.name : 'Unknown',
      status: statusOf.get(String(s._id)) || null, // null = not marked yet
    })),
  });
});

// POST /api/attendance  { class, date, records: [{ student, status }] }
exports.mark = asyncHandler(async (req, res) => {
  const { class: classId, date, records } = req.body;
  if (!classId || !Array.isArray(records) || records.length === 0) {
    throw new ApiError(400, 'class and records are required');
  }
  const day = dayStart(date);
  // The server clock is UTC but users may be ahead of it (Dhaka is UTC+6), so allow one day of slack.
  if (day.getTime() > dayStart().getTime() + 24 * 60 * 60 * 1000) {
    throw new ApiError(400, 'Attendance cannot be marked for a future date');
  }

  const ids = records.map((r) => String(r.student));
  if (records.some((r) => !STATUSES.includes(r.status))) {
    throw new ApiError(400, `status must be one of: ${STATUSES.join(', ')}`);
  }
  // Integrity check: every student in the request must really belong to this class.
  const inClass = await Student.countDocuments({ _id: { $in: ids }, class: String(classId) });
  if (inClass !== ids.length) throw new ApiError(400, 'Some students do not belong to this class');

  // One round-trip to the database. upsert = update if the row exists, insert if not,
  // so saving the same day twice never creates duplicates.
  await Attendance.bulkWrite(
    records.map((r) => ({
      updateOne: {
        filter: { student: String(r.student), date: day },
        update: { $set: { status: r.status, class: String(classId), markedBy: req.user._id } },
        upsert: true,
      },
    }))
  );
  res.json({ success: true, message: `Attendance saved for ${records.length} students` });
});

// GET /api/attendance/student/:id   (students use /student/me and always get their own)
exports.getForStudent = asyncHandler(async (req, res) => {
  const studentId = await resolveStudentId(req, req.params.id);
  const records = await Attendance.find({ student: studentId }).sort('-date').limit(366).select('date status');

  const summary = { present: 0, absent: 0, late: 0 };
  records.forEach((r) => {
    summary[r.status] += 1;
  });
  summary.total = records.length;
  summary.percentage = summary.total
    ? Math.round(((summary.present + summary.late) / summary.total) * 100)
    : 0;

  res.json({ success: true, data: { summary, records } });
});
