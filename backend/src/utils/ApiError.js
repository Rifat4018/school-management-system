// An error that carries an HTTP status code, e.g. throw new ApiError(404, 'Student not found').
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

module.exports = ApiError;
