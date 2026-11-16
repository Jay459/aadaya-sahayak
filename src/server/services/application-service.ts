import { randomUUID } from 'node:crypto';
import type { ApplicationEvent, Officer, TransitionCommand } from '../../shared/contracts.ts';
import type { Database, Queryable } from '../db/database.ts';
import {
  findApplication,
  listApplications,
  updateApplication,
} from '../repositories/application-repository.ts';
import { appendEvent, listEvents } from '../repositories/event-repository.ts';
import { completeReceipt, reserveReceipt } from '../repositories/idempotency-repository.ts';
import { allowedActions, resolveTransition } from '../models/workflow.ts';
import { requireApplicationAccess } from './access-policy.ts';
import { canonicalJson, eventHash, hashText, verifyAuditChain } from './audit-service.ts';
import { sortByPriority } from './priority-service.ts';
import {
  requireCurrentVersion,
  requireEvidenceReview,
  requireReason,
  requireStepEvidence,
} from './transition-guards.ts';
import { AppError } from '../shared/app-error.ts';

async function requireApplication(db: Queryable, id: string, officer: Officer) {
  const application = await findApplication(db, id);
  if (!application) throw new AppError(404, 'NOT_FOUND', 'దరఖాస్తు అందుబాటులో లేదు.');
  requireApplicationAccess(officer, application);
  return application;
}

function eventReason(command: TransitionCommand): string {
  if (command.action === 'SUBMIT_REPORT') return command.report?.notes ?? '';
  if (command.action === 'RECOMMEND') return command.recommendation?.note ?? '';
  return command.reason ?? '';
}

export function createApplicationService(database: Database, clock = () => new Date()) {
  async function list(officer: Officer) {
    return sortByPriority(await listApplications(database.pool, officer), clock());
  }

  async function detail(id: string, officer: Officer) {
    const application = await requireApplication(database.pool, id, officer);
    const events = await listEvents(database.pool, id);
    return {
      application,
      events,
      allowedActions: allowedActions(application.state, officer.role),
      auditIntact: verifyAuditChain(id, events),
    };
  }

  async function transition(id: string, officer: Officer, key: string, command: TransitionCommand) {
    const requestHash = hashText(canonicalJson({ applicationId: id, command }));
    return database.transaction(async (client) => {
      const application = await requireApplication(client, id, officer);
      const replay = await reserveReceipt(client, officer.id, key, requestHash);
      if (replay) return replay;

      requireCurrentVersion(application, command.expectedVersion);
      const nextState = resolveTransition(application.state, officer.role, command.action);
      requireReason(command);
      requireEvidenceReview(command);
      requireStepEvidence(application, command);

      const next = {
        ...application,
        state: nextState,
        version: application.version + 1,
        returned: application.returned || command.action === 'RETURN',
        fieldReport: command.action === 'SUBMIT_REPORT' ? command.report! : application.fieldReport,
        recommendation:
          command.action === 'RETURN'
            ? null
            : (command.recommendation ?? application.recommendation),
      };
      const updated = await updateApplication(client, next, command.expectedVersion);
      if (!updated) throw new AppError(409, 'VERSION_CONFLICT', 'ఈ దరఖాస్తు మారింది. వివరాలను మళ్లీ తెరవండి.');

      // The conditional UPDATE above holds a row lock until commit. History appends for
      // this application therefore cannot interleave with another successful transition.
      const events = await listEvents(client, id);
      const payload: Omit<ApplicationEvent, 'hash'> = {
        id: randomUUID(),
        applicationId: id,
        actorName: officer.name,
        actorRole: officer.role,
        action: command.action,
        fromState: application.state,
        toState: nextState,
        reason: eventReason(command),
        evidence: {
          ...(command.report ? { report: command.report } : {}),
          ...(command.recommendation ? { recommendation: command.recommendation } : {}),
          ...(command.reviewedEvidence !== undefined
            ? { reviewedEvidence: command.reviewedEvidence }
            : {}),
        },
        createdAt: clock().toISOString(),
        previousHash: events.at(-1)?.hash ?? hashText(id),
      };
      await appendEvent(client, { ...payload, hash: eventHash(payload) });
      const receipt = { applicationId: id, state: nextState, version: next.version };
      await completeReceipt(client, officer.id, key, receipt);
      return receipt;
    });
  }

  return { list, detail, transition };
}

export type ApplicationService = ReturnType<typeof createApplicationService>;
