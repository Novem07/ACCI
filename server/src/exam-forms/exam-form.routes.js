const express = require('express');

const { issueExamFormsSchema } = require('./exam-form.schema');
const { parsePagination, toPageResponse } = require('../http/pagination');
const { authenticate } = require('../middleware/authenticate');
const { requireRole } = require('../middleware/require-role');
const { httpError } = require('../errors');
const { ROLES } = require('../domain/constants');

function createExamFormRouter({ service, authService }) {
  const router = express.Router();
  router.use(authenticate(authService));
  const staff = requireRole(ROLES.RECEPTION, ROLES.ACCOUNTING, ROLES.EXAM_ORGANIZER);
  const organizer = requireRole(ROLES.EXAM_ORGANIZER);

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
      next(httpError(400, 'VALIDATION_ERROR', 'Phân lịch thi không hợp lệ.', parsed.error.flatten().fieldErrors));
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
