import { existsSync } from 'node:fs';
import { defineConfig, env } from 'prisma/config';

// Render injects DATABASE_URL; locally it comes from server/.env.
if (existsSync('.env')) process.loadEnvFile();

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: env('DATABASE_URL') },
});
