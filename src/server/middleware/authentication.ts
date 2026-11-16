import { timingSafeEqual } from 'node:crypto';
import type { RequestHandler, Response } from 'express';
import type { Queryable } from '../db/database.ts';
import { readSession } from '../services/session-service.ts';
import type { ActiveSession } from '../services/session-service.ts';
import { AppError } from '../shared/app-error.ts';

export function getSession(response: Response): ActiveSession {
  return response.locals.session as ActiveSession;
}

export function requireAuthentication(db: Queryable, cookieName: string): RequestHandler {
  return async (request, response, next) => {
    const token: unknown = request.cookies?.[cookieName];
    if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) {
      throw new AppError(401, 'LOGIN_REQUIRED', 'దయచేసి లాగిన్ అవ్వండి.');
    }
    const session = await readSession(db, token);
    if (!session) throw new AppError(401, 'LOGIN_REQUIRED', 'మీ సెషన్ ముగిసింది. మళ్లీ లాగిన్ అవ్వండి.');
    response.locals.session = session;
    next();
  };
}

export const requireCsrf: RequestHandler = (request, response, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    next();
    return;
  }
  const supplied = request.get('X-CSRF-Token') ?? '';
  const expected = getSession(response).csrfToken;
  if (
    !/^[a-f0-9]{64}$/.test(supplied) ||
    !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))
  ) {
    throw new AppError(403, 'CSRF_FAILED', 'సెషన్‌ను రిఫ్రెష్ చేసి మళ్లీ ప్రయత్నించండి.');
  }
  next();
};

export function requireTrustedOrigin(origin: string): RequestHandler {
  return (request, _response, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      next();
      return;
    }
    if (request.get('Origin') !== origin) {
      throw new AppError(403, 'ORIGIN_FORBIDDEN', 'ఈ అభ్యర్థనకు అనుమతి లేదు.');
    }
    next();
  };
}
