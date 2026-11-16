import { test } from 'node:test';
import assert from 'node:assert/strict';
import { application } from '../fixtures.ts';
import {
  requireCurrentVersion,
  requireEvidenceReview,
  requireReason,
  requireStepEvidence,
} from '../../src/server/services/transition-guards.ts';

test('stale versions conflict', () =>
  assert.throws(() => requireCurrentVersion(application(), 2), { status: 409 }));
test('current version passes', () =>
  assert.doesNotThrow(() => requireCurrentVersion(application(), 1)));
test('return requires a meaningful reason', () =>
  assert.throws(() => requireReason({ action: 'RETURN', expectedVersion: 1, reason: '  ' }), {
    status: 422,
  }));
test('approval requires human evidence review', () =>
  assert.throws(() => requireEvidenceReview({ action: 'APPROVE', expectedVersion: 1 }), {
    status: 422,
  }));
test('reviewed decision passes review guard', () =>
  assert.doesNotThrow(() =>
    requireEvidenceReview({ action: 'REJECT', expectedVersion: 1, reviewedEvidence: true }),
  ));
test('GPO cannot submit without a report', () =>
  assert.throws(
    () => requireStepEvidence(application(), { action: 'SUBMIT_REPORT', expectedVersion: 1 }),
    { status: 422 },
  ));
test('RI cannot recommend without a field report', () =>
  assert.throws(
    () =>
      requireStepEvidence(application(), {
        action: 'RECOMMEND',
        expectedVersion: 1,
        recommendation: { action: 'APPROVE', note: 'Reviewed report' },
      }),
    { status: 422 },
  ));
test('Tahsildar cannot decide without an RI recommendation', () =>
  assert.throws(
    () => requireStepEvidence(application(), { action: 'APPROVE', expectedVersion: 1 }),
    { status: 422 },
  ));
