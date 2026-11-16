import { loadEnvironment } from './config/env.ts';
import { createDatabase } from './db/database.ts';
import { createApp } from './app.ts';

const environment = loadEnvironment();
const database = createDatabase(environment.DATABASE_URL);
const app = createApp(database, environment);
const server = app.listen(environment.PORT, '0.0.0.0', () => {
  console.info(JSON.stringify({ event: 'server_started', port: environment.PORT }));
});

let shuttingDown = false;
function shutdown(): void {
  if (shuttingDown) return;
  shuttingDown = true;
  server.close(() => {
    void database.pool.end().then(() => process.exit(0));
  });
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
