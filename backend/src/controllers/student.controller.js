const User = require('../models/User');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Result = require('../models/Result');
const Fee = require('../models/Fee');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { pick, escapeRegex, getPaging, paginationMeta } = require('../utils/helpers');

const PROFILE_FIELDS = ['class', 'rollNo', 'gender', 'dateOfBirth', 'guardianName', 'guardianPhone', 'address'];
const populate = [
  { path: 'user', select: 'name email' },
  { path: 'class', select: 'name section' },
];

// GET /api/students?page=1&limit=10&search=rahim&class=<classId>
exports.getAll = asyncHandler(async (req, res) => {
  const paging = getPaging(req.query);
  const filter = {};
  if (typeof req.query.class === 'string' && req.query.class) filter.class = req.query.class;

  // The name lives in the User collection, so first find matching users, then their students.
  if (typeof req.query.search === 'string' && req.query.search) {
    const rx = new RegExp(escapeRegex(req.query.search), 'i');
    const users = await User.find({ role: 'student', $or: [{ name: rx }, { email: rx }] }).select('_id');
    filter.user = { $in: users.map((u) => u._id) };
  }

  const [data, total] = await Promise.all([
    Student.find(filter).populate(populate).sort('class rollNo').skip(paging.skip).limit(paging.limit),
    Student.countDocuments(filter),
  ]);
  res.json({ success: true, data, pagination: paginationMeta(paging, total) });
});

// GET /api/students/:id
exports.getOne = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id).populate(populate);
  if (!student) throw new ApiError(404, 'Student not found');
  res.json({ success: true, data: student });
});

// GET /api/students/me  (the logged-in student's own profile)
exports.getMe = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ user: req.user._id }).populate(populate);
  if (!student) throw new ApiError(404, 'Student profile not found');
  res.json({ success: true, data: student });
});

// POST /api/students  -> creates the login account AND the student profile
exports.create = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const user = await User.create({ name, email, password, role: 'student' });

  let student;
  try {
    student = await Student.create({ ...pick(req.body, PROFILE_FIELDS), user: user._id });
  } catch (err) {
    // Manual rollback: do not leave a login account without a profile.
    // (With a MongoDB replica set / Atlas this would be a transaction.)
    await User.findByIdAndDelete(user._id);
    throw err;
  }
  await student.populate(populate);
  res.status(201).json({ success: true, data: student });
});

// PUT /api/students/:id
exports.update = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) throw new ApiError(404, 'Student not found');

  const userChanges = pick(req.body, ['name', 'email']);
  if (Object.keys(userChanges).length) {
    await User.findByIdAndUpdate(student.user, userChanges, { runValidators: true });
  }
  Object.assign(student, pick(req.body, PROFILE_FIELDS));
  await student.save();
  await student.populate(populate);
  res.json({ success: true, data: student });
});

// DELETE /api/students/:id  -> also removes everything that belongs to the student
exports.remove = asyncHandler(async (req, res) => {
  const student = await Student.findByIdAndDelete(req.params.id);
  if (!student) throw new ApiError(404, 'Student not found');
  await Promise.all([
    User.findByIdAndDelete(student.user),
    Attendance.deleteMany({ student: student._id }),
    Result.deleteMany({ student: student._id }),
    Fee.deleteMany({ student: student._id }),
  ]);
  res.json({ success: true, message: 'Student deleted' });
});
