const express = require('express');

const { issueExamFormsSchema } = require('./exam-form.schema');
const { parsePagination, toPageResponse } = require('../http/pagination');
const { authenticate } = require('../middleware/authenticate');
const { requireRole } = require('../middleware/require-role');

function createExamFormRouter({ service, authService }) {
  const router = express.Router();
  router.use(authenticate(authService));
  const staff = requireRole('Tiếp nhận', 'Kế Toán', 'Tổ chức thi');
  const organizer = requireRole('Tổ chức thi');

  router.get('/', staff, async (req, res, next) => {
    try {
      const { page, pageSize, query } = parsePagination(req.query);
      const pageResult = await service.list({ page, pageSize, query });
      res.json(toPageResponse(pageResult, 'examForms'));
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
