import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword } from '../../src/server/services/password-service.ts';

test('correct password verifies and a wrong password fails', async () => {
  const hash = await hashPassword('a-long-test-password');
  assert.equal(await verifyPassword('a-long-test-password', hash), true);
  assert.equal(await verifyPassword('wrong-password', hash), false);
});
test('equal passwords receive different salts', async () => {
  assert.notEqual(await hashPassword('same-password'), await hashPassword('same-password'));
});
test('malformed stored hashes are denied', async () => {
  assert.equal(await verifyPassword('test', 'malformed'), false);
});
