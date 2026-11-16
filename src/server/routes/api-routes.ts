import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import type { Database } from '../db/database.ts';
import type { Environment } from '../config/env.ts';
import { createAuthController } from '../controllers/auth-controller.ts';
import { createApplicationController } from '../controllers/application-controller.ts';
import { createAiController } from '../controllers/ai-controller.ts';
import {
  requireAuthentication,
  requireCsrf,
  requireTrustedOrigin,
} from '../middleware/authentication.ts';
import { createApplicationService } from '../services/application-service.ts';
import { createAiService } from '../services/ai/ai-service.ts';
import { mockProvider } from '../services/ai/mock-provider.ts';
import { createGeminiProvider } from '../services/ai/gemini-provider.ts';

export function createApiRoutes(database: Database, environment: Environment) {
  const router = Router();
  const auth = createAuthController(database.pool, environment);
  const applications = createApplicationService(database);
  const controller = createApplicationController(applications);
  const provider =
    environment.AI_PROVIDER === 'gemini'
      ? createGeminiProvider(environment.GEMINI_API_KEY, environment.GEMINI_MODEL)
      : mockProvider;
  const ai = createAiService(database.pool, applications, provider);

  router.get('/health', async (_request, response) => {
    await database.pool.query('SELECT 1');
    response.json({ status: 'ok' });
  });
  router.use(requireTrustedOrigin(environment.APP_ORIGIN));
  router.post(
    '/auth/login',
    rateLimit({ windowMs: 60000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false }),
    auth.login,
  );
  router.use(requireAuthentication(database.pool, auth.cookieName));
  router.use(requireCsrf);
  router.get('/auth/me', auth.me);
  router.post('/auth/logout', auth.logout);
  router.get('/applications', controller.list);
  router.get('/applications/:id', controller.detail);
  router.post('/applications/:id/transitions', controller.transition);
  router.post(
    '/applications/:id/ai',
    rateLimit({ windowMs: 60000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false }),
    createAiController(ai),
  );
  return router;
}
