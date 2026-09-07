const express = require('express');

const { invoiceSchema } = require('./payment.schema');
const { authenticate } = require('../middleware/authenticate');
const { requireRole } = require('../middleware/require-role');

function createPaymentRouter({ service, authService }) {
  const router = express.Router();
  router.use(authenticate(authService));
  const accountant = requireRole('Kế Toán');

  router.get('/', accountant, async (req, res, next) => {
    try {
      res.json({ payments: await service.list() });
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

  router.post('/:registrationId/invoices', accountant, async (req, res, next) => {
    const parsed = invoiceSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Thông tin hóa đơn không hợp lệ.', details: parsed.error.flatten().fieldErrors },
      });
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
