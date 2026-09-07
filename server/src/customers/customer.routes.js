const express = require('express');

const { customerSchema } = require('./customer.schema');
const { authenticate } = require('../middleware/authenticate');
const { requireRole } = require('../middleware/require-role');

function createCustomerRouter({ service, authService }) {
  const router = express.Router();
  router.use(authenticate(authService));

  router.get('/', requireRole('Tiếp nhận', 'Kế Toán', 'Tổ chức thi'), async (req, res, next) => {
    try {
      res.json({ customers: await service.list() });
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
      res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Thông tin khách hàng không hợp lệ.', details: parsed.error.flatten().fieldErrors },
      });
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
