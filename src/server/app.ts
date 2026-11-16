import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { rateLimit } from 'express-rate-limit';
import type { Database } from './db/database.ts';
import type { Environment } from './config/env.ts';
import { createApiRoutes } from './routes/api-routes.ts';
import { requestContext, errorHandler } from './middleware/error-handler.ts';
import { AppError } from './shared/app-error.ts';

export function createApp(database: Database, environment: Environment) {
  const app = express();
  app.disable('x-powered-by');
  if (environment.TRUST_PROXY_HOPS) app.set('trust proxy', environment.TRUST_PROXY_HOPS);
  app.use(
    helmet({
      contentSecurityPolicy: environment.NODE_ENV === 'production' ? undefined : false,
      strictTransportSecurity: environment.NODE_ENV === 'production' ? undefined : false,
    }),
  );
  app.use(express.json({ limit: '32kb' }));
  app.use(cookieParser());
  app.use('/api', requestContext);
  app.use(
    '/api',
    rateLimit({ windowMs: 60000, limit: 120, standardHeaders: 'draft-8', legacyHeaders: false }),
  );
  app.use('/api/v1', createApiRoutes(database, environment));
  app.use('/api', () => {
    throw new AppError(404, 'NOT_FOUND', 'సేవ అందుబాటులో లేదు.');
  });

  const webRoot = resolve('dist/web');
  if (existsSync(webRoot)) {
    app.use(express.static(webRoot));
    app.get('/{*path}', (_request, response) => {
      response.sendFile(resolve(webRoot, 'index.html'));
    });
  }
  app.use(errorHandler);
  return app;
}
