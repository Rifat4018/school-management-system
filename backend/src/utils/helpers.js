const ApiError = require('./ApiError');

// Whitelist: copy only the allowed keys from the request body (prevents mass assignment).
exports.pick = (obj = {}, keys = []) =>
  keys.reduce((out, key) => {
    if (obj[key] !== undefined) out[key] = obj[key];
    return out;
  }, {});

// Escape user text before using it inside a RegExp.
exports.escapeRegex = (text) => String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

exports.getPaging = (query) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};

exports.paginationMeta = ({ page, limit }, total) => ({
  page,
  limit,
  total,
  pages: Math.max(Math.ceil(total / limit), 1),
});

// Normalise any date to 00:00 UTC so "one attendance row per student per day" can be a unique index.
exports.dayStart = (value) => {
  const d = value ? new Date(value) : new Date();
  if (Number.isNaN(d.getTime())) throw new ApiError(400, 'Invalid date');
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

// Percentage -> letter grade and grade point (Bangladesh secondary-school scale).
exports.gradeOf = (pct) => {
  if (pct >= 80) return { grade: 'A+', point: 5 };
  if (pct >= 70) return { grade: 'A', point: 4 };
  if (pct >= 60) return { grade: 'A-', point: 3.5 };
  if (pct >= 50) return { grade: 'B', point: 3 };
  if (pct >= 40) return { grade: 'C', point: 2 };
  if (pct >= 33) return { grade: 'D', point: 1 };
  return { grade: 'F', point: 0 };
};
