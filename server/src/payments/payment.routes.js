const express = require('express');

const { invoiceSchema, paymentListQuerySchema } = require('./payment.schema');
const { parsePagination, toPageResponse } = require('../http/pagination');
const { httpError } = require('../errors');
const { authenticate } = require('../middleware/authenticate');
const { requireRole } = require('../middleware/require-role');
const { ROLES } = require('../domain/constants');

function createPaymentRouter({ service, authService }) {
  const router = express.Router();
  router.use(authenticate(authService));
  const accountant = requireRole(ROLES.ACCOUNTING);

  router.get('/', accountant, async (req, res, next) => {
    try {
      const pagination = parsePagination(req.query);
      const parsed = paymentListQuerySchema.safeParse({ status: pagination.status || undefined });
      if (!parsed.success) throw httpError(400, 'VALIDATION_ERROR', 'Bộ lọc thanh toán không hợp lệ.');
      const page = await service.list({ ...pagination, status: parsed.data.status || '' });
      res.json(toPageResponse(page, 'payments'));
    } catch (error) {
      next(error);
    }
  });

  router.get('/:registrationId', accountant, async (req, res, next) => {
    try {
      res.json({ payment: await service.get(req.params.registrationId) });
    } catch (error) {
      next(error);
    }
  });

  router.get('/:registrationId/quote', accountant, async (req, res, next) => {
    try {
      res.json({ quote: await service.quote(req.params.registrationId) });
    } catch (error) {
      next(error);
    }
  });

  router.get('/:registrationId/checkout', accountant, async (req, res, next) => {
    try {
      res.json(await service.getCheckout(req.params.registrationId));
    } catch (error) {
      next(error);
    }
  });

  router.post('/:registrationId/invoices', accountant, async (req, res, next) => {
    const parsed = invoiceSchema.safeParse(req.body);
    if (!parsed.success) {
      next(httpError(400, 'VALIDATION_ERROR', 'Thông tin hóa đơn không hợp lệ.', parsed.error.flatten().fieldErrors));
      return;
    }
    try {
      const invoice = await service.createInvoice({
        registrationId: req.params.registrationId,
        input: parsed.data,
        userId: req.user.id,
      });
      res.status(201).json({ invoice });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = { createPaymentRouter };
