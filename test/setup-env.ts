process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.DATABASE_URL =
  process.env.DATABASE_URL ??
  'postgresql://hiremind:hiremind@localhost:5432/hiremind?schema=public';
process.env.REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';
process.env.JWT_ACCESS_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.JWT_INTERNAL_SECRET = 'test-internal-secret';
