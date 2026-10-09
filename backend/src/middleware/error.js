exports.notFound = (req, _res, next) => {
  const ApiError = require('../utils/ApiError');
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

// eslint-disable-next-line no-unused-vars
exports.errorHandler = (err, _req, res, _next) => {
  let status = err.status || 500;
  let message = err.message;
  let errors = err.errors;

  if (err.name === 'ValidationError' && err.errors && !Array.isArray(err.errors)) {
    status = 400;
    errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    message = errors[0].message;
  } else if (err.name === 'CastError') {
    status = 400;
    message = `Invalid ${err.path}`;
    errors = undefined;
  } else if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyPattern || {}).find((k) => k !== 'userId');
    message = field === 'email' ? 'An account with this email already exists' : field === 'name' ? 'That name is already in use' : 'A record with the same unique value already exists';
  } else if (err.name === 'MulterError') {
    status = 400;
    message = err.code === 'LIMIT_FILE_SIZE' ? 'File is too large (max 5 MB)' : err.message;
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Invalid JSON body';
  }

  if (status >= 500) {
    console.error(err);
    if (process.env.NODE_ENV === 'production') message = 'Internal server error';
  }
  res.status(status).json({ success: false, message, ...(errors ? { errors } : {}) });
};
