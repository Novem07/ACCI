const { z } = require('zod');

const booleanFromEnv = z.preprocess((value) => {
  if (value === undefined || value === '') return undefined;
  if (typeof value === 'boolean') return value;
  return String(value).toLowerCase() === 'true';
}, z.boolean());

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  CLIENT_ORIGIN: z.string().url().default('http://localhost:3000'),
  DB_SERVER: z.string().trim().min(1),
  DB_PORT: z.coerce.number().int().min(1).max(65535).default(1433),
  DB_NAME: z.string().trim().min(1),
  DB_USER: z.string().trim().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_ENCRYPT: booleanFromEnv.default(false),
  DB_TRUST_SERVER_CERTIFICATE: booleanFromEnv.default(false),
  JWT_SECRET: z.string().min(32),
});

function loadConfig(env = process.env) {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const fields = parsed.error.issues.map((issue) => issue.path.join('.')).join(', ');
    throw new Error(`Invalid environment configuration: ${fields}`);
  }

  return {
    nodeEnv: parsed.data.NODE_ENV,
    port: parsed.data.PORT,
    clientOrigin: parsed.data.CLIENT_ORIGIN,
    jwtSecret: parsed.data.JWT_SECRET,
    db: {
      server: parsed.data.DB_SERVER,
      port: parsed.data.DB_PORT,
      database: parsed.data.DB_NAME,
      user: parsed.data.DB_USER,
      password: parsed.data.DB_PASSWORD,
      options: {
        encrypt: parsed.data.DB_ENCRYPT,
        trustServerCertificate: parsed.data.DB_TRUST_SERVER_CERTIFICATE,
      },
    },
  };
}

module.exports = { loadConfig };
