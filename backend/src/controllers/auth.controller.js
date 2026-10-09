const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });

const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role });

// POST /api/auth/login
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, 'Email and password are required');

  // String(...) blocks NoSQL injection such as { "email": { "$gt": "" } }
  const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select('+password');

  // Same message for "no such user" and "wrong password" so attackers cannot discover valid emails.
  if (!user || !user.isActive || !(await user.matchPassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }
  res.json({ success: true, token: signToken(user), user: publicUser(user) });
});

// GET /api/auth/me
exports.me = (req, res) => res.json({ success: true, user: publicUser(req.user) });

// PUT /api/auth/password
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) throw new ApiError(400, 'Current and new password are required');

  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.matchPassword(currentPassword))) throw new ApiError(400, 'Current password is wrong');

  user.password = String(newPassword); // hashed by the pre('save') hook
  await user.save();
  res.json({ success: true, message: 'Password updated' });
});
