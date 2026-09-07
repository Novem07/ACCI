const express = require('express');

const { issueExamFormsSchema } = require('./exam-form.schema');
const { authenticate } = require('../middleware/authenticate');
const { requireRole } = require('../middleware/require-role');

function positiveInt(value, fallback) {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : NaN;
}

function createExamFormRouter({ service, authService }) {
  const router = express.Router();
  router.use(authenticate(authService));
  const staff = requireRole('Tiếp nhận', 'Kế Toán', 'Tổ chức thi');
  const organizer = requireRole('Tổ chức thi');

  router.get('/', staff, async (req, res, next) => {
    const page = positiveInt(req.query.page, 1);
    const pageSize = positiveInt(req.query.pageSize, 20);
    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'page/pageSize không hợp lệ.' } });
      return;
    }
    try {
      res.json(await service.list({ page, pageSize, query: String(req.query.query || '').trim() }));
    } catch (error) {
      next(error);
    }
  });

  router.get('/:examFormId', staff, async (req, res, next) => {
    try {
      res.json({ examForm: await service.get(req.params.examFormId) });
    } catch (error) {
      next(error);
    }
  });

  router.post('/', organizer, async (req, res, next) => {
    const parsed = issueExamFormsSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Phân lịch thi không hợp lệ.', details: parsed.error.flatten().fieldErrors },
      });
      return;
    }
    try {
      res.status(201).json({ issuance: await service.create({ input: parsed.data, userId: req.user.id }) });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = { createExamFormRouter };
