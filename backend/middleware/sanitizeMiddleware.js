// Basic sanitization to strip Mongo operator injection keys
const sanitizeObject = (obj) => {
  if (obj && typeof obj === 'object') {
    Object.keys(obj).forEach((key) => {
      if (key.startsWith('$') || key.includes('.')) {
        delete obj[key];
      } else {
        sanitizeObject(obj[key]);
      }
    });
  }
};

const sanitize = (req, res, next) => {
  ['body', 'query', 'params'].forEach((part) => {
    if (req[part]) sanitizeObject(req[part]);
  });
  next();
};

module.exports = sanitize;
