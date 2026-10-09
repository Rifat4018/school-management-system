const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const Attendance = require('../models/Attendance');
const Result = require('../models/Result');
const Fee = require('../models/Fee');
const Notice = require('../models/Notice');
const asyncHandler = require('../utils/asyncHandler');
const { dayStart } = require('../utils/helpers');
const { ownStudentId } = require('../utils/scope');

// [{ _id: 'paid', value: 5000 }, ...]  ->  { paid: 5000, ... }
const toObject = (rows, defaults) => rows.reduce((out, r) => ({ ...out, [r._id]: r.value }), { ...defaults });

// GET /api/dashboard?date=YYYY-MM-DD  (date = the client's "today")
exports.getDashboard = asyncHandler(async (req, res) => {
  const { role } = req.user;
  const noticeFilter = role === 'admin' ? {} : { audience: { $in: ['all', role] } };
  const notices = await Notice.find(noticeFilter).sort('-createdAt').limit(5).select('title body audience createdAt');

  if (role === 'student') {
    const studentId = await ownStudentId(req);
    // Aggregation pipelines do not auto-cast, so studentId must be a real ObjectId (it is).
    const [attendance, unpaid, resultCount] = await Promise.all([
      Attendance.aggregate([{ $match: { student: studentId } }, { $group: { _id: '$status', value: { $sum: 1 } } }]),
      Fee.aggregate([
        { $match: { student: studentId, status: 'unpaid' } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Result.countDocuments({ student: studentId }),
    ]);
    const att = toObject(attendance, { present: 0, absent: 0, late: 0 });
    const days = att.present + att.absent + att.late;
    return res.json({
      success: true,
      data: {
        role,
        attendance: { ...att, percentage: days ? Math.round(((att.present + att.late) / days) * 100) : 0 },
        fees: { unpaidTotal: unpaid.length ? unpaid[0].total : 0, unpaidCount: unpaid.length ? unpaid[0].count : 0 },
        resultCount,
        notices,
      },
    });
  }

  const today = dayStart(typeof req.query.date === 'string' ? req.query.date : undefined);
  const [students, teachers, classes, subjects, fees, attendanceToday, studentsPerClass] = await Promise.all([
    Student.countDocuments(),
    Teacher.countDocuments(),
    Class.countDocuments(),
    Subject.countDocuments(),
    Fee.aggregate([{ $group: { _id: '$status', value: { $sum: '$amount' } } }]),
    Attendance.aggregate([{ $match: { date: today } }, { $group: { _id: '$status', value: { $sum: 1 } } }]),
    // GROUP BY class, then JOIN the classes collection to get the class name.
    Student.aggregate([
      { $group: { _id: '$class', count: { $sum: 1 } } },
      { $lookup: { from: 'classes', localField: '_id', foreignField: '_id', as: 'class' } },
      { $unwind: '$class' },
      { $project: { _id: 0, name: { $concat: ['$class.name', ' - ', '$class.section'] }, count: 1 } },
      { $sort: { name: 1 } },
    ]),
  ]);

  res.json({
    success: true,
    data: {
      role,
      counts: { students, teachers, classes, subjects },
      fees: toObject(fees, { paid: 0, unpaid: 0 }),
      attendanceToday: toObject(attendanceToday, { present: 0, absent: 0, late: 0 }),
      studentsPerClass,
      notices,
    },
  });
});
