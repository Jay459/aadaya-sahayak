import { test } from 'node:test';
import assert from 'node:assert/strict';
import { application, officer } from '../fixtures.ts';
import {
  canAccessApplication,
  requireApplicationAccess,
} from '../../src/server/services/access-policy.ts';

test('GPO can read their village', () =>
  assert.equal(canAccessApplication(officer, application()), true));
test('GPO cannot read another village', () =>
  assert.equal(canAccessApplication(officer, application({ villageId: 'other' })), false));
test('RI can read villages across their mandal', () =>
  assert.equal(
    canAccessApplication({ ...officer, role: 'RI' }, application({ villageId: 'other' })),
    true,
  ));
test('Tahsildar cannot read another mandal', () =>
  assert.equal(
    canAccessApplication({ ...officer, role: 'TAHSILDAR' }, application({ mandalId: 'other' })),
    false,
  ));
test('hidden application returns 404', () => {
  assert.throws(() => requireApplicationAccess(officer, application({ mandalId: 'other' })), {
    status: 404,
  });
});
