const { httpError } = require('../errors');

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      next(httpError(401, 'UNAUTHENTICATED', 'Bạn cần đăng nhập.'));
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(httpError(403, 'FORBIDDEN', 'Bạn không có quyền thực hiện thao tác này.'));
      return;
    }
    next();
  };
}

module.exports = { requireRole };
