const express = require('express');

const { registrationSchema } = require('./registration.schema');
const { parsePagination, toPageResponse } = require('../http/pagination');
const { authenticate } = require('../middleware/authenticate');
const { requireRole } = require('../middleware/require-role');
const { httpError } = require('../errors');
const { ROLES } = require('../domain/constants');

function createRegistrationRouter({ service, authService }) {
  const router = express.Router();
  router.use(authenticate(authService));
  const reception = requireRole(ROLES.RECEPTION);
  const staff = requireRole(ROLES.RECEPTION, ROLES.ACCOUNTING, ROLES.EXAM_ORGANIZER);

  router.get('/', staff, async (req, res, next) => {
    try {
      const pagination = parsePagination(req.query);
      const page = await service.list(pagination);
      res.json(toPageResponse(page, 'registrations'));
    } catch (error) {
      next(error);
    }
  });

  router.post('/', reception, async (req, res, next) => {
    const parsed = registrationSchema.safeParse(req.body);
    if (!parsed.success) {
      next(httpError(400, 'VALIDATION_ERROR', 'Thông tin đăng ký không hợp lệ.', parsed.error.flatten().fieldErrors));
      return;
    }
    try {
      const registration = await service.create({ input: parsed.data, userId: req.user.id });
      res.status(201).json({ registration });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = { createRegistrationRouter };
