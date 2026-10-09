// Express 4 does not catch errors thrown inside async functions.
// This wrapper forwards any rejected promise to next(), i.e. to the central error handler,
// so controllers do not need their own try/catch.
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
