const sql = require('mssql');

function createPool(config) {
  return new sql.ConnectionPool({
    server: config.db.server,
    port: config.db.port,
    database: config.db.database,
    user: config.db.user,
    password: config.db.password,
    options: config.db.options,
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
  });
}

module.exports = { createPool, sql };
