/** An error with an HTTP status that the error handler turns into `{ message, errors? }`. */
class HttpError extends Error {
  constructor(status, message, errors) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.errors = errors;
  }
}

const badRequest = (message, errors) => new HttpError(400, message, errors);
const unauthorized = (message = 'Authentication required.') => new HttpError(401, message);
const forbidden = (message = 'You do not have permission to do that.') => new HttpError(403, message);
const notFound = (message = 'Not found.') => new HttpError(404, message);
const conflict = (message) => new HttpError(409, message);

module.exports = { HttpError, badRequest, unauthorized, forbidden, notFound, conflict };
