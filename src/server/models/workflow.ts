import type { ApplicationState, Role, WorkflowAction } from '../../shared/contracts.ts';
import { AppError } from '../shared/app-error.ts';

interface TransitionRule {
  from: ApplicationState;
  action: WorkflowAction;
  role: Role;
  to: ApplicationState;
}

// A short, explicit table is easier to review than nested role/state conditionals.
export const transitionRules: readonly TransitionRule[] = [
  { from: 'PENDING_GPO', action: 'SUBMIT_REPORT', role: 'GPO', to: 'PENDING_RI' },
  { from: 'PENDING_RI', action: 'RECOMMEND', role: 'RI', to: 'PENDING_TAHSILDAR' },
  { from: 'PENDING_RI', action: 'RETURN', role: 'RI', to: 'PENDING_GPO' },
  { from: 'PENDING_TAHSILDAR', action: 'RETURN', role: 'TAHSILDAR', to: 'PENDING_RI' },
  { from: 'PENDING_TAHSILDAR', action: 'APPROVE', role: 'TAHSILDAR', to: 'APPROVED' },
  { from: 'PENDING_TAHSILDAR', action: 'REJECT', role: 'TAHSILDAR', to: 'REJECTED' },
];

export function allowedActions(state: ApplicationState, role: Role): WorkflowAction[] {
  return transitionRules
    .filter((rule) => rule.from === state && rule.role === role)
    .map((rule) => rule.action);
}

export function resolveTransition(
  state: ApplicationState,
  role: Role,
  action: WorkflowAction,
): ApplicationState {
  const rule = transitionRules.find(
    (item) => item.from === state && item.role === role && item.action === action,
  );
  if (!rule) throw new AppError(422, 'INVALID_TRANSITION', 'ఈ దశలో ఈ చర్యకు అనుమతి లేదు.');
  return rule.to;
}
