import type { ApplicationEvent, CertificateApplication, Officer } from '../src/shared/contracts.ts';
import { eventHash, hashText } from '../src/server/services/audit-service.ts';

export const officer: Officer = {
  id: '00000000-0000-4000-8000-000000000001',
  username: 'test.gpo',
  name: 'Test Officer',
  role: 'GPO',
  mandalId: 'm1',
  villageIds: ['v1'],
};
export function application(
  overrides: Partial<CertificateApplication> = {},
): CertificateApplication {
  return {
    id: '00000000-0000-4000-8000-000000000002',
    reference: 'TEST-001',
    applicantName: 'Fictional applicant',
    villageName: 'Test village',
    villageId: 'v1',
    mandalId: 'm1',
    purpose: 'Scholarship',
    declaredIncome: 100000,
    documentIncome: 100000,
    state: 'PENDING_GPO',
    version: 1,
    submittedAt: '2026-11-10T00:00:00Z',
    dueAt: '2026-11-17T00:00:00Z',
    returned: false,
    fieldReport: null,
    recommendation: null,
    ...overrides,
  };
}
export function event(applicationId = application().id): ApplicationEvent {
  const payload: Omit<ApplicationEvent, 'hash'> = {
    id: 'e1',
    applicationId,
    actorName: officer.name,
    actorRole: 'GPO',
    action: 'SUBMIT_REPORT',
    fromState: 'PENDING_GPO',
    toState: 'PENDING_RI',
    reason: 'Visited household',
    createdAt: '2026-11-16T10:00:00Z',
    previousHash: hashText(applicationId),
  };
  return { ...payload, hash: eventHash(payload) };
}
