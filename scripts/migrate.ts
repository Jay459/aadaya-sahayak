import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { loadEnvironment } from '../src/server/config/env.ts';
import { createDatabase } from '../src/server/db/database.ts';
const environment = loadEnvironment();
const database = createDatabase(environment.DATABASE_URL_UNPOOLED || environment.DATABASE_URL);
try {
  await database.transaction(async (client) => {
    await client.query("SELECT pg_advisory_xact_lock(hashtext('aadaya-schema-migrations'))");
    await client.query(
      'CREATE TABLE IF NOT EXISTS schema_migrations(name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())',
    );
    const existing = await client.query('SELECT name FROM schema_migrations WHERE name=$1', [
      '001_initial',
    ]);
    if (existing.rowCount) return;
    const file = fileURLToPath(
      new URL('../src/server/db/migrations/001_initial.sql', import.meta.url),
    );
    await client.query(await readFile(file, 'utf8'));
    await client.query('INSERT INTO schema_migrations(name) VALUES($1)', ['001_initial']);
  });
  console.info('Migrations applied.');
} finally {
  await database.pool.end();
}
