const express = require('express');

const { customerSchema } = require('./customer.schema');
const { parsePagination, toPageResponse } = require('../http/pagination');
const { authenticate } = require('../middleware/authenticate');
const { requireRole } = require('../middleware/require-role');
const { httpError } = require('../errors');

function createCustomerRouter({ service, authService }) {
  const router = express.Router();
  router.use(authenticate(authService));

  router.get('/', requireRole('Tiếp nhận', 'Kế Toán', 'Tổ chức thi'), async (req, res, next) => {
    try {
      const pagination = parsePagination(req.query);
      const page = await service.list(pagination);
      res.json(toPageResponse(page, 'customers'));
    } catch (error) {
      next(error);
    }
  });

  router.get('/:customerId', requireRole('Tiếp nhận', 'Kế Toán', 'Tổ chức thi'), async (req, res, next) => {
    try {
      res.json({ customer: await service.get(req.params.customerId) });
    } catch (error) {
      next(error);
    }
  });

  router.post('/', requireRole('Tiếp nhận'), async (req, res, next) => {
    const parsed = customerSchema.safeParse(req.body);
    if (!parsed.success) {
      next(httpError(400, 'VALIDATION_ERROR', 'Thông tin khách hàng không hợp lệ.', parsed.error.flatten().fieldErrors));
      return;
    }
    try {
      res.status(201).json({ customer: await service.create(parsed.data) });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = { createCustomerRouter };
