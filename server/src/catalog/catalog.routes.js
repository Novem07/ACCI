const express = require('express');

const { authenticate } = require('../middleware/authenticate');
const { requireRole } = require('../middleware/require-role');
const { parsePagination, toPageResponse } = require('../http/pagination');
const { ROLES } = require('../domain/constants');

function createCatalogRouter({ service, authService }) {
  const router = express.Router();
  router.use(authenticate(authService));
  const certificateStaff = requireRole(ROLES.RECEPTION, ROLES.ACCOUNTING, ROLES.EXAM_ORGANIZER, ROLES.DATA_ENTRY, ROLES.PROCTOR);
  const candidateStaff = requireRole(ROLES.RECEPTION, ROLES.ACCOUNTING, ROLES.EXAM_ORGANIZER);

  router.get('/certificates', certificateStaff, async (req, res, next) => {
    try {
      res.json({ certificates: await service.listCertificates() });
    } catch (error) {
      next(error);
    }
  });

  router.get('/candidates', candidateStaff, async (req, res, next) => {
    try {
      const pagination = parsePagination(req.query);
      const page = await service.listCandidates(pagination);
      res.json(toPageResponse(page, 'candidates'));
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = { createCatalogRouter };
