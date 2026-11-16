import { randomUUID } from 'node:crypto';
import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../shared/app-error.ts';

export const requestContext: RequestHandler = (_request, response, next) => {
  response.locals.requestId = randomUUID();
  response.setHeader('X-Request-Id', response.locals.requestId as string);
  response.setHeader('Cache-Control', 'no-store');
  next();
};

export const errorHandler: ErrorRequestHandler = (error: unknown, _request, response, _next) => {
  if (error instanceof ZodError) {
    response.status(422).json({
      code: 'VALIDATION_FAILED',
      message: 'వివరాలు సరిచూసి మళ్లీ ప్రయత్నించండి.',
      requestId: response.locals.requestId,
    });
    return;
  }
  if (error instanceof AppError) {
    response
      .status(error.status)
      .json({ code: error.code, message: error.message, requestId: response.locals.requestId });
    return;
  }
  const bodyError = error as { type?: string };
  const status =
    bodyError?.type === 'entity.too.large'
      ? 413
      : bodyError?.type === 'entity.parse.failed'
        ? 400
        : 500;
  console.error(
    JSON.stringify({
      event: 'request_failed',
      status,
      requestId: response.locals.requestId,
      errorCodes: getErrorCodes(error),
    }),
  );
  response.status(status).json({
    code: 'REQUEST_FAILED',
    message: 'అభ్యర్థన పూర్తికాలేదు. మళ్లీ ప్రయత్నించండి.',
    requestId: response.locals.requestId,
  });
};

// Only log diagnostic codes; messages can contain connection strings or SQL data.
function getErrorCodes(error: unknown): string[] {
  if (!error || typeof error !== 'object') return [];
  const details = error as { code?: unknown; errors?: unknown[]; cause?: unknown };
  const codes =
    typeof details.code === 'string' && /^[A-Z0-9_]{2,64}$/.test(details.code)
      ? [details.code]
      : [];
  const children = error instanceof AggregateError ? error.errors : [];
  for (const child of children) {
    if (child && typeof child === 'object' && 'code' in child) {
      const code = (child as { code?: unknown }).code;
      if (typeof code === 'string' && /^[A-Z0-9_]{2,64}$/.test(code)) codes.push(code);
    }
  }
  return [...new Set(codes)];
}
