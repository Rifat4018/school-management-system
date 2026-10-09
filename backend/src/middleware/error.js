const ApiError = require('../utils/ApiError');

exports.notFound = (req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

// Central error handler: every error in the app ends here and becomes one JSON shape.
// eslint-disable-next-line no-unused-vars
exports.errorHandler = (err, req, res, next) => {
  let status = err.statusCode || 500;
  let message = err.message || 'Server error';

  if (err.name === 'CastError') {
    status = 400; // e.g. a malformed ObjectId in the URL
    message = `Invalid ${err.path}`;
  } else if (err.name === 'ValidationError') {
    status = 400; // Mongoose schema validation failed
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  } else if (err.code === 11000) {
    status = 409; // unique index violated
    const keys = Object.keys(err.keyValue || {}).join(', ');
    message = keys ? `Duplicate value for: ${keys}` : 'This record already exists';
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    status = 401;
    message = 'Invalid or expired token, please log in again';
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Request body is not valid JSON';
  }

  if (status >= 500) {
    console.error(err);
    if (process.env.NODE_ENV === 'production') message = 'Server error'; // never leak internals
  }
  res.status(status).json({ success: false, message });
};
