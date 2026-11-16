import { test } from 'node:test';
import assert from 'node:assert/strict';
import { application, event } from '../fixtures.ts';
import {
  canonicalJson,
  eventHash,
  verifyAuditChain,
} from '../../src/server/services/audit-service.ts';

test('canonical JSON ignores object key ordering recursively', () => {
  assert.equal(
    canonicalJson({ b: { z: 1, a: 2 }, a: [2, 1] }),
    canonicalJson({ a: [2, 1], b: { a: 2, z: 1 } }),
  );
});
test('unaltered history verifies', () =>
  assert.equal(verifyAuditChain(application().id, [event()]), true));
test('changed history fails verification', () =>
  assert.equal(verifyAuditChain(application().id, [{ ...event(), reason: 'Changed' }]), false));
test('reordered events fail verification', () => {
  const first = event();
  const { hash: _hash, ...payload } = { ...first, id: 'e2', previousHash: first.hash };
  const second = { ...payload, hash: eventHash(payload) };
  assert.equal(verifyAuditChain(application().id, [first, second]), true);
  assert.equal(verifyAuditChain(application().id, [second, first]), false);
});
test('event from another application fails verification', () =>
  assert.equal(verifyAuditChain('other', [event()]), false));

test('changing the reviewed evidence snapshot breaks the hash', () => {
  const { hash: _hash, ...base } = event();
  const payload = { ...base, evidence: { reviewedEvidence: true } };
  const original = { ...payload, hash: eventHash(payload) };
  assert.equal(verifyAuditChain(application().id, [original]), true);
  assert.equal(
    verifyAuditChain(application().id, [{ ...original, evidence: { reviewedEvidence: false } }]),
    false,
  );
});
