function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401).json({
        error: { code: 'UNAUTHENTICATED', message: 'Bạn cần đăng nhập.' },
      });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        error: { code: 'FORBIDDEN', message: 'Bạn không có quyền thực hiện thao tác này.' },
      });
      return;
    }
    next();
  };
}

module.exports = { requireRole };
