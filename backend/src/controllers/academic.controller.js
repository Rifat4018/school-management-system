// Classes, subjects, fees and notices are plain CRUD, so they are built with the generic factory.
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const Student = require('../models/Student');
const Fee = require('../models/Fee');
const Notice = require('../models/Notice');
const crudFactory = require('../utils/crudFactory');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ownStudentId } = require('../utils/scope');

const teacherPopulate = { select: 'employeeId user', populate: { path: 'user', select: 'name' } };

exports.classes = crudFactory(Class, {
  fields: ['name', 'section', 'classTeacher'],
  populate: { path: 'classTeacher', ...teacherPopulate },
  searchFields: ['name'],
  sort: 'name section',
  beforeDelete: async (req) => {
    if (await Student.exists({ class: req.params.id })) {
      throw new ApiError(409, 'This class still has students. Move or remove them first.');
    }
    await Subject.deleteMany({ class: req.params.id });
  },
});

exports.subjects = crudFactory(Subject, {
  fields: ['name', 'code', 'class', 'teacher'],
  populate: [
    { path: 'class', select: 'name section' },
    { path: 'teacher', ...teacherPopulate },
  ],
  searchFields: ['name', 'code'],
  filterFields: ['class', 'teacher'],
  sort: 'code',
});

exports.fees = crudFactory(Fee, {
  fields: ['student', 'title', 'amount', 'dueDate'],
  populate: {
    path: 'student',
    select: 'rollNo user class',
    populate: [
      { path: 'user', select: 'name' },
      { path: 'class', select: 'name section' },
    ],
  },
  searchFields: ['title'],
  filterFields: ['status', 'student'],
  // A student only ever sees their own fees, whatever the query string says.
  scope: async (req, filter) => {
    if (req.user.role === 'student') filter.student = await ownStudentId(req);
  },
});

// PATCH /api/fees/:id/pay
exports.payFee = asyncHandler(async (req, res) => {
  const fee = await Fee.findByIdAndUpdate(req.params.id, { status: 'paid', paidAt: new Date() }, { new: true });
  if (!fee) throw new ApiError(404, 'Fee not found');
  res.json({ success: true, data: fee });
});

exports.notices = crudFactory(Notice, {
  fields: ['title', 'body', 'audience'],
  populate: { path: 'createdBy', select: 'name role' },
  searchFields: ['title', 'body'],
  // Admin sees everything; others see notices for everyone or for their own role.
  scope: async (req, filter) => {
    if (req.user.role !== 'admin') filter.audience = { $in: ['all', req.user.role] };
  },
  beforeCreate: async (req, body) => {
    body.createdBy = req.user._id;
  },
});
