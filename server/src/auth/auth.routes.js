const express = require('express');
const rateLimit = require('express-rate-limit');
const { z } = require('zod');

const { authError, createAuthService } = require('./auth.service');
const { authenticate } = require('../middleware/authenticate');
const { httpError } = require('../errors');
const { validate } = require('../http/validate');

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

function createAuthRouter({ db, config, authService }) {
  const router = express.Router();
  const service = authService || createAuthService({ db, jwtSecret: config.jwtSecret });
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: config.nodeEnv === 'test' ? 100 : 5,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (req, res, next) => next(httpError(429, 'LOGIN_RATE_LIMITED', 'Quá nhiều lần đăng nhập thất bại.')),
  });

  router.post('/login', loginLimiter, validate({ body: loginSchema }, 'Mã nhân viên và mật khẩu là bắt buộc.'), async (req, res, next) => {
    try {
      const { user, token } = await service.login(req.validated.body.employeeId, req.validated.body.password);
      res.cookie('acci_session', token, cookieOptions(config));
      res.status(200).json({ user });
    } catch (error) {
      next(error);
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
