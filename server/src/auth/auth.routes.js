const express = require('express');
const rateLimit = require('express-rate-limit');
const { z } = require('zod');

const { authError, createAuthService } = require('./auth.service');
const { authenticate } = require('../middleware/authenticate');

const loginSchema = z.object({
  employeeId: z.string().trim().min(1).max(20),
  password: z.string().min(1).max(200),
});

function cookieOptions(config) {
  return {
    httpOnly: true,
    sameSite: 'strict',
    secure: config.nodeEnv === 'production',
    path: '/',
    maxAge: 15 * 60 * 1000,
  };
}

function sendError(res, error) {
  const status = error.status || 500;
  res.status(status).json({
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: status >= 500 ? 'Đã xảy ra lỗi máy chủ.' : error.message,
    },
  });
}

function createAuthRouter({ db, config, authService }) {
  const router = express.Router();
  const service = authService || createAuthService({ db, jwtSecret: config.jwtSecret });
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: config.nodeEnv === 'test' ? 100 : 5,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: { code: 'LOGIN_RATE_LIMITED', message: 'Quá nhiều lần đăng nhập thất bại.' } },
  });

  router.post('/login', loginLimiter, async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Mã nhân viên và mật khẩu là bắt buộc.',
          details: parsed.error.flatten().fieldErrors,
        },
      });
      return;
    }

    try {
      const { user, token } = await service.login(parsed.data.employeeId, parsed.data.password);
      res.cookie('acci_session', token, cookieOptions(config));
      res.status(200).json({ user });
    } catch (error) {
      sendError(res, error);
    }
  });

  router.get('/me', authenticate(service), (req, res) => {
    res.status(200).json({ user: req.user });
  });

  router.post('/logout', (req, res) => {
    res.clearCookie('acci_session', cookieOptions(config));
    res.status(204).send();
  });

  return router;
}

module.exports = { createAuthRouter, cookieOptions };
