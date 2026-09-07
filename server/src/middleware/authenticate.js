function authenticate(authService) {
  return (req, res, next) => {
    const token = req.cookies?.acci_session;
    if (!token) {
      res.status(401).json({
        error: { code: 'UNAUTHENTICATED', message: 'Bạn cần đăng nhập.' },
      });
      return;
    }

    try {
      req.user = authService.verify(token);
      next();
    } catch (error) {
      res.status(error.status || 401).json({
        error: {
          code: error.code || 'UNAUTHENTICATED',
          message: error.message,
        },
      });
    }
  };
}

module.exports = { authenticate };
