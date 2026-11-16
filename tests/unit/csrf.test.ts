import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Request, Response } from 'express';
import { requireCsrf, requireTrustedOrigin } from '../../src/server/middleware/authentication.ts';

const token = 'a'.repeat(64);
function request(method: string, headers: Record<string, string> = {}): Request {
  return { method, get: (name: string) => headers[name] } as unknown as Request;
}
const response = { locals: { session: { csrfToken: token } } } as unknown as Response;

test('cross-origin writes are rejected before login', () => {
  assert.throws(
    () =>
      requireTrustedOrigin('https://example.test')(
        request('POST', { Origin: 'https://attacker.test' }),
        response,
        () => {},
      ),
    { status: 403 },
  );
});
test('mutating request without CSRF token fails', () => {
  assert.throws(() => requireCsrf(request('POST'), response, () => {}), { status: 403 });
});
test('incorrect CSRF token fails', () => {
  assert.throws(
    () => requireCsrf(request('POST', { 'X-CSRF-Token': 'b'.repeat(64) }), response, () => {}),
    { status: 403 },
  );
});
test('valid CSRF token allows the next handler', () => {
  let continued = false;
  requireCsrf(request('POST', { 'X-CSRF-Token': token }), response, () => {
    continued = true;
  });
  assert.equal(continued, true);
});
test('read-only requests do not require CSRF', () => {
  let continued = false;
  requireCsrf(request('GET'), response, () => {
    continued = true;
  });
  assert.equal(continued, true);
});
