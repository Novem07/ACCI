const cors = require('cors');
const cookieParser = require('cookie-parser');
const express = require('express');
const helmet = require('helmet');

const { createAuthRouter } = require('./auth/auth.routes');
const { createAuthService } = require('./auth/auth.service');
const { createCustomerRouter } = require('./customers/customer.routes');
const { createCustomerService } = require('./customers/customer.service');
const { errorHandler } = require('./middleware/error-handler');
const { createRegistrationRouter } = require('./registrations/registration.routes');
const { createRegistrationService } = require('./registrations/registration.service');

function createApp({ db, config, services = {} } = {}) {
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
    const authService = createAuthService({ db, jwtSecret: config.jwtSecret });
    app.use('/api/auth', createAuthRouter({ db, config, authService }));
    app.use('/api/customers', createCustomerRouter({
      service: services.customer || createCustomerService({ db }),
      authService,
    }));
    app.use('/api/registrations', createRegistrationRouter({
      service: services.registration || createRegistrationService({ db }),
      authService,
    }));
  }

  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
