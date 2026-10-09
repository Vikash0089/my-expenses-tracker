const ApiError = require('../utils/ApiError');

/** Validates req[source] with a zod schema and replaces it with the parsed (stripped) result. */
module.exports = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const errors = result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
    return next(new ApiError(400, errors[0].message, errors));
  }
  req[source] = result.data;
  next();
};
