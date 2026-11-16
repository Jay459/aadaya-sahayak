export type Role = 'GPO' | 'RI' | 'TAHSILDAR';
export type ApplicationState =
  'PENDING_GPO' | 'PENDING_RI' | 'PENDING_TAHSILDAR' | 'APPROVED' | 'REJECTED';
export type WorkflowAction = 'SUBMIT_REPORT' | 'RECOMMEND' | 'APPROVE' | 'REJECT' | 'RETURN';
export type AiFeature = 'report' | 'discrepancies' | 'brief';

export interface Officer {
  id: string;
  username: string;
  name: string;
  role: Role;
  mandalId: string;
  villageIds: string[];
}

export interface FieldReport {
  annualIncome: number;
  familyMembers: number;
  occupation: string;
  notes: string;
}

export interface Recommendation {
  action: 'APPROVE' | 'REJECT';
  note: string;
}

export interface CertificateApplication {
  id: string;
  reference: string;
  applicantName: string;
  villageName: string;
  villageId: string;
  mandalId: string;
  purpose: string;
  declaredIncome: number;
  documentIncome: number;
  state: ApplicationState;
  version: number;
  submittedAt: string;
  dueAt: string;
  returned: boolean;
  fieldReport: FieldReport | null;
  recommendation: Recommendation | null;
}

export interface TransitionCommand {
  action: WorkflowAction;
  expectedVersion: number;
  reason?: string;
  reviewedEvidence?: boolean;
  report?: FieldReport;
  recommendation?: Recommendation;
}

export interface ApplicationEvent {
  id: string;
  applicationId: string;
  actorName: string;
  actorRole: Role | 'SYSTEM';
  action: string;
  fromState: ApplicationState | null;
  toState: ApplicationState;
  reason: string;
  createdAt: string;
  evidence?: { report?: FieldReport; recommendation?: Recommendation; reviewedEvidence?: boolean };
  previousHash: string;
  hash: string;
}

export interface ApplicationDetail {
  application: CertificateApplication;
  allowedActions: WorkflowAction[];
  events: ApplicationEvent[];
  auditIntact: boolean;
}

export interface AiSuggestion {
  id: string;
  provider: 'gemini' | 'mock';
  feature: AiFeature;
  summary: string;
  findings: { note: string; evidence: string }[];
  report: FieldReport | null;
  disclaimer: string;
}
