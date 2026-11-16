import { test } from 'node:test';
import assert from 'node:assert/strict';
import { application } from '../fixtures.ts';
import { priorityScore, sortByPriority } from '../../src/server/services/priority-service.ts';

const now = new Date('2026-11-16T00:00:00Z');
test('overdue applications outrank future applications', () => {
  const overdue = application({ dueAt: '2026-11-13T00:00:00Z' });
  assert.ok(priorityScore(overdue, now) > priorityScore(application(), now));
});
test('a returned file receives an explainable five-point increase', () => {
  assert.equal(
    priorityScore(application({ returned: true }), now) - priorityScore(application(), now),
    5,
  );
});
test('priority sorting does not mutate caller arrays', () => {
  const future = application({ id: 'future', dueAt: '2026-11-20T00:00:00Z' });
  const overdue = application({ id: 'overdue', dueAt: '2026-11-12T00:00:00Z' });
  const original = [future, overdue];
  assert.equal(sortByPriority(original, now)[0]?.id, 'overdue');
  assert.equal(original[0]?.id, 'future');
});

test('a file overdue by minutes still outranks one due soon', () => {
  const overdue = application({ dueAt: '2026-11-15T23:55:00Z' });
  assert.ok(priorityScore(overdue, now) > priorityScore(application(), now));
});
