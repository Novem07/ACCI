require('dotenv').config();

const { createApp } = require('./app');
const { loadConfig } = require('./config');
const { createPool } = require('./db');

async function start() {
  const config = loadConfig();
  const pool = createPool(config);

  try {
    await pool.connect();
    await pool.request().query('SELECT 1 AS ready');
  } catch (error) {
    console.error(`Database startup failed for ${config.db.server}/${config.db.database}: ${error.code || error.message}`);
    await pool.close().catch(() => undefined);
    process.exitCode = 1;
    return null;
  }

  const app = createApp({ db: pool, config });
  const server = app.listen(config.port, () => {
    console.log(`Backend listening on http://localhost:${config.port}`);
  });

  const shutdown = async (signal) => {
    server.close(async () => {
      await pool.close();
      console.log(`Backend stopped after ${signal}`);
      process.exit(0);
    });
  };

  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
  return server;
}

if (require.main === module) {
  start().catch((error) => {
    console.error(`Backend startup failed: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = { start };
