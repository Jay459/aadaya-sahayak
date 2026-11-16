import type { AiFeature, CertificateApplication, FieldReport } from '../../../shared/contracts.ts';

export interface AiInput {
  feature: AiFeature;
  declaredIncome: number;
  documentIncome: number;
  fieldReport: FieldReport | null;
  recommendation: CertificateApplication['recommendation'];
  officerNotes: string;
}

export interface AiOutput {
  summary: string;
  findings: { note: string; evidence: string }[];
  report: FieldReport | null;
}

export interface AiProvider {
  name: 'mock' | 'gemini';
  generate(input: AiInput): Promise<AiOutput>;
}
