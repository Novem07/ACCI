const express = require('express');

const { extensionSchema } = require('./extension.schema');
const { authenticate } = require('../middleware/authenticate');
const { requireRole } = require('../middleware/require-role');
const { ROLES } = require('../domain/constants');
const { validate } = require('../http/validate');

function createExtensionRouter({ service, authService }) {
  const router = express.Router();
  router.use(authenticate(authService));
  const reception = requireRole(ROLES.RECEPTION);

  router.get('/:examFormId/extension-options', reception, async (req, res, next) => {
    try {
      res.json(await service.options(req.params.examFormId));
    } catch (error) {
      next(error);
    }
  });

  router.post('/', reception, validate({ body: extensionSchema }, 'Thông tin gia hạn không hợp lệ.'), async (req, res, next) => {
    try {
      const extension = await service.create({ input: req.validated.body, userId: req.user.id });
      res.status(201).json({ extension });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = { createExtensionRouter };
