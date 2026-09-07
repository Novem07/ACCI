const express = require('express');

const { extensionSchema } = require('./extension.schema');
const { authenticate } = require('../middleware/authenticate');
const { requireRole } = require('../middleware/require-role');

function createExtensionRouter({ service, authService }) {
  const router = express.Router();
  router.use(authenticate(authService));
  const reception = requireRole('Tiếp nhận');

  router.get('/:examFormId/extension-options', reception, async (req, res, next) => {
    try {
      res.json(await service.options(req.params.examFormId));
    } catch (error) {
      next(error);
    }
  });

  router.post('/', reception, async (req, res, next) => {
    const parsed = extensionSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Thông tin gia hạn không hợp lệ.', details: parsed.error.flatten().fieldErrors },
      });
      return;
    }
    try {
      const extension = await service.create({ input: parsed.data, userId: req.user.id });
      res.status(201).json({ extension });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = { createExtensionRouter };
