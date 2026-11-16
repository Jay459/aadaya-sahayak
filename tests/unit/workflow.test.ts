import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  allowedActions,
  resolveTransition,
  transitionRules,
} from '../../src/server/models/workflow.ts';
import type { ApplicationState, Role, WorkflowAction } from '../../src/shared/contracts.ts';

for (const rule of transitionRules) {
  test(rule.role + ': ' + rule.from + ' -> ' + rule.action, () => {
    assert.equal(resolveTransition(rule.from, rule.role, rule.action), rule.to);
    assert.ok(allowedActions(rule.from, rule.role).includes(rule.action));
  });
}

function assertForbiddenActions(state: ApplicationState, role: Role): void {
  const actions: WorkflowAction[] = ['SUBMIT_REPORT', 'RECOMMEND', 'APPROVE', 'REJECT', 'RETURN'];
  for (const action of actions) {
    if (!allowedActions(state, role).includes(action)) {
      assert.throws(() => resolveTransition(state, role, action));
    }
  }
}

test('all forbidden state/role/action combinations are denied', () => {
  const states: ApplicationState[] = [
    'PENDING_GPO',
    'PENDING_RI',
    'PENDING_TAHSILDAR',
    'APPROVED',
    'REJECTED',
  ];
  const roles: Role[] = ['GPO', 'RI', 'TAHSILDAR'];
  for (const state of states) {
    for (const role of roles) {
      assertForbiddenActions(state, role);
    }
  }
});

test('terminal applications have no actions, even for Tahsildar', () => {
  assert.deepEqual(allowedActions('APPROVED', 'TAHSILDAR'), []);
  assert.deepEqual(allowedActions('REJECTED', 'TAHSILDAR'), []);
});
