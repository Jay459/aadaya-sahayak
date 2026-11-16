import type { RequestHandler } from 'express';
import type { Environment } from '../config/env.ts';
import type { Queryable } from '../db/database.ts';
import { loginSchema } from '../models/validation.ts';
import { createAuthService } from '../services/auth-service.ts';
import { revokeSession } from '../services/session-service.ts';
import { getSession } from '../middleware/authentication.ts';

export function createAuthController(db: Queryable, environment: Environment) {
  const auth = createAuthService(db);
  const cookieName = environment.NODE_ENV === 'production' ? '__Host-aadaya_sid' : 'aadaya_sid';
  const cookieOptions = {
    httpOnly: true,
    secure: environment.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  };

  const login: RequestHandler = async (request, response) => {
    const input = loginSchema.parse(request.body);
    const result = await auth.login(input.username, input.password);
    const oldToken: unknown = request.cookies?.[cookieName];
    if (typeof oldToken === 'string') await revokeSession(db, oldToken);
    response.cookie(cookieName, result.token, { ...cookieOptions, maxAge: 8 * 60 * 60 * 1000 });
    response.json({ officer: result.officer, csrfToken: result.csrfToken });
  };

  const me: RequestHandler = (_request, response) => {
    response.json(getSession(response));
  };

  const logout: RequestHandler = async (request, response) => {
    const token: unknown = request.cookies?.[cookieName];
    if (typeof token === 'string') await revokeSession(db, token);
    response.clearCookie(cookieName, cookieOptions);
    response.status(204).end();
  };

  return { login, me, logout, cookieName };
}
