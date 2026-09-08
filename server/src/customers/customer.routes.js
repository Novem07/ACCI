const express = require('express');

const { customerSchema } = require('./customer.schema');
const { parsePagination, toPageResponse } = require('../http/pagination');
const { authenticate } = require('../middleware/authenticate');
const { requireRole } = require('../middleware/require-role');
const { ROLES } = require('../domain/constants');
const { validate } = require('../http/validate');

function createCustomerRouter({ service, authService }) {
  const router = express.Router();
  router.use(authenticate(authService));

  router.get('/', requireRole(ROLES.RECEPTION, ROLES.ACCOUNTING, ROLES.EXAM_ORGANIZER), async (req, res, next) => {
    try {
      const pagination = parsePagination(req.query);
      const page = await service.list(pagination);
      res.json(toPageResponse(page, 'customers'));
    } catch (error) {
      next(error);
    }
  });

  router.get('/:customerId', requireRole(ROLES.RECEPTION, ROLES.ACCOUNTING, ROLES.EXAM_ORGANIZER), async (req, res, next) => {
    try {
      res.json({ customer: await service.get(req.params.customerId) });
    } catch (error) {
      next(error);
    }
  });

  router.post('/', requireRole(ROLES.RECEPTION), validate({ body: customerSchema }, 'Thông tin khách hàng không hợp lệ.'), async (req, res, next) => {
    try {
      res.status(201).json({ customer: await service.create(req.validated.body) });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = { createCustomerRouter };
