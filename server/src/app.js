const cors = require('cors');
const cookieParser = require('cookie-parser');
const express = require('express');
const helmet = require('helmet');

const { createAuthRouter } = require('./auth/auth.routes');
const { errorHandler } = require('./middleware/error-handler');

function createApp({ db, config } = {}) {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({
    origin: config?.clientOrigin || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  }));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.locals.db = db;
  app.locals.config = config;

  app.get('/api/health/live', (req, res) => {
    res.status(200).json({ status: 'live' });
  });

  app.get('/api/health/ready', async (req, res) => {
    try {
      if (!app.locals.db?.request) {
        res.status(503).json({ status: 'not-ready' });
        return;
      }
      await app.locals.db.request().query('SELECT 1 AS ready');
      res.status(200).json({ status: 'ready' });
    } catch {
      res.status(503).json({ status: 'not-ready' });
    }
  });

  if (db && config) {
    app.use('/api/auth', createAuthRouter({ db, config }));
  }

  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
