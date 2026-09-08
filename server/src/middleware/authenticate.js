const { httpError } = require('../errors');

function authenticate(authService) {
  return (req, res, next) => {
    const token = req.cookies?.acci_session;
    if (!token) {
      next(httpError(401, 'UNAUTHENTICATED', 'Bạn cần đăng nhập.'));
      return;
    }

    try {
      req.user = authService.verify(token);
      next();
    } catch (error) {
      next(error.status ? error : httpError(401, 'UNAUTHENTICATED', 'Phiên đăng nhập không hợp lệ.'));
    }
  };
}

module.exports = { authenticate };
