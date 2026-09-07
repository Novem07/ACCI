function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    next(error);
    return;
  }

  const status = Number.isInteger(error.status) ? error.status : 500;
  const code = error.code || (status === 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR');
  const body = {
    error: {
      code,
      message: status === 500 ? 'Đã xảy ra lỗi máy chủ.' : error.message,
    },
  };

  if (error.details) body.error.details = error.details;
  if (status >= 500) console.error(error);
  res.status(status).json(body);
}

module.exports = { errorHandler };
