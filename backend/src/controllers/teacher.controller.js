const User = require('../models/User');
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { pick, escapeRegex, getPaging, paginationMeta } = require('../utils/helpers');

const PROFILE_FIELDS = ['employeeId', 'specialization', 'qualification', 'phone'];
const populate = { path: 'user', select: 'name email' };

// GET /api/teachers?search=
exports.getAll = asyncHandler(async (req, res) => {
  const paging = getPaging(req.query);
  const filter = {};
  if (typeof req.query.search === 'string' && req.query.search) {
    const rx = new RegExp(escapeRegex(req.query.search), 'i');
    const users = await User.find({ role: 'teacher', name: rx }).select('_id');
    filter.$or = [{ user: { $in: users.map((u) => u._id) } }, { employeeId: rx }, { specialization: rx }];
  }
  const [data, total] = await Promise.all([
    Teacher.find(filter).populate(populate).sort('employeeId').skip(paging.skip).limit(paging.limit),
    Teacher.countDocuments(filter),
  ]);
  res.json({ success: true, data, pagination: paginationMeta(paging, total) });
});

// GET /api/teachers/:id
exports.getOne = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findById(req.params.id).populate(populate);
  if (!teacher) throw new ApiError(404, 'Teacher not found');
  res.json({ success: true, data: teacher });
});

// POST /api/teachers
exports.create = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const user = await User.create({ name, email, password, role: 'teacher' });

  let teacher;
  try {
    teacher = await Teacher.create({ ...pick(req.body, PROFILE_FIELDS), user: user._id });
  } catch (err) {
    await User.findByIdAndDelete(user._id); // manual rollback
    throw err;
  }
  await teacher.populate(populate);
  res.status(201).json({ success: true, data: teacher });
});

// PUT /api/teachers/:id
exports.update = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findById(req.params.id);
  if (!teacher) throw new ApiError(404, 'Teacher not found');

  const userChanges = pick(req.body, ['name', 'email']);
  if (Object.keys(userChanges).length) {
    await User.findByIdAndUpdate(teacher.user, userChanges, { runValidators: true });
  }
  Object.assign(teacher, pick(req.body, PROFILE_FIELDS));
  await teacher.save();
  await teacher.populate(populate);
  res.json({ success: true, data: teacher });
});

// DELETE /api/teachers/:id  -> classes and subjects keep existing, but lose this teacher
exports.remove = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findByIdAndDelete(req.params.id);
  if (!teacher) throw new ApiError(404, 'Teacher not found');
  await Promise.all([
    User.findByIdAndDelete(teacher.user),
    Class.updateMany({ classTeacher: teacher._id }, { $unset: { classTeacher: 1 } }),
    Subject.updateMany({ teacher: teacher._id }, { $unset: { teacher: 1 } }),
  ]);
  res.json({ success: true, message: 'Teacher deleted' });
});
