const { httpError } = require('../errors');

function validate(schemas, message = 'Dữ liệu không hợp lệ.') {
  return (req, res, next) => {
    const parsed = {};

    for (const [source, schema] of Object.entries(schemas)) {
      const result = schema.safeParse(req[source]);
      if (!result.success) {
        next(httpError(400, 'VALIDATION_ERROR', message, result.error.flatten().fieldErrors));
        return;
      }
      parsed[source] = result.data;
    }

    req.validated = { ...(req.validated || {}), ...parsed };
    next();
  };
}

module.exports = { validate };
