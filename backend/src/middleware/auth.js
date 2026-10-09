const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// Authentication: "who are you?"  Reads "Authorization: Bearer <token>", verifies it,
// and attaches the user to req.user for the next middleware/controller.
exports.protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new ApiError(401, 'You are not logged in');

  const decoded = jwt.verify(token, process.env.JWT_SECRET); // throws if invalid or expired

  // Re-check the database so deleted/deactivated users lose access immediately.
  const user = await User.findById(decoded.id);
  if (!user || !user.isActive) throw new ApiError(401, 'This account no longer exists');

  req.user = user;
  next();
});

// Authorization: "are you allowed to do this?"  Usage: authorize('admin', 'teacher')
exports.authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(new ApiError(403, 'You do not have permission to do this'));
  }
  next();
};
