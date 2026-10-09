// Data scoping: a logged-in student may only ever read their OWN records.
const Student = require('../models/Student');
const ApiError = require('./ApiError');

exports.ownStudentId = async (req) => {
  const student = await Student.findOne({ user: req.user._id }).select('_id');
  if (!student) throw new ApiError(404, 'Student profile not found');
  return student._id;
};

// Staff pass a student id in the URL; for students the id is ignored and replaced by their own.
exports.resolveStudentId = async (req, id) => {
  if (req.user.role === 'student') return exports.ownStudentId(req);
  if (!id || id === 'me') throw new ApiError(400, 'Student id is required');
  return id;
};
