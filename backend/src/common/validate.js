const ApiError = require('./ApiError');

/**
 * @param {import('joi').ObjectSchema} schema
 * @param {'body'|'query'|'params'} source
 */
const validate = (schema, source = 'body') => (req, res, next) => {
  const { error, value } = schema.validate(req[source], { abortEarly: false, stripUnknown: true });
  if (error) {
    const details = error.details.map((d) => d.message);
    return next(new ApiError(422, 'Validation failed', details));
  }
  req[source] = value;
  next();
};

module.exports = validate;
