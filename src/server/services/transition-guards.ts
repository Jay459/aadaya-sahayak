import type { CertificateApplication, TransitionCommand } from '../../shared/contracts.ts';
import { AppError } from '../shared/app-error.ts';

export function requireCurrentVersion(
  application: CertificateApplication,
  expectedVersion: number,
): void {
  if (application.version !== expectedVersion) {
    throw new AppError(409, 'VERSION_CONFLICT', 'ఈ దరఖాస్తు మారింది. వివరాలను మళ్లీ తెరవండి.');
  }
}

export function requireReason(command: TransitionCommand): void {
  const needsReason = ['APPROVE', 'REJECT', 'RETURN'].includes(command.action);
  if (needsReason && (!command.reason || command.reason.trim().length < 5)) {
    throw new AppError(422, 'REASON_REQUIRED', 'కనీసం ఐదు అక్షరాలతో కారణం నమోదు చేయండి.');
  }
}

export function requireEvidenceReview(command: TransitionCommand): void {
  if (['APPROVE', 'REJECT'].includes(command.action) && command.reviewedEvidence !== true) {
    throw new AppError(422, 'REVIEW_REQUIRED', 'ముందుగా ఆధారాలను సమీక్షించండి.');
  }
}

export function requireStepEvidence(
  application: CertificateApplication,
  command: TransitionCommand,
): void {
  if (command.action === 'SUBMIT_REPORT' && !command.report) {
    throw new AppError(422, 'REPORT_REQUIRED', 'క్షేత్ర విచారణ నివేదిక అవసరం.');
  }
  if (command.action === 'RECOMMEND' && (!command.recommendation || !application.fieldReport)) {
    throw new AppError(422, 'RECOMMENDATION_REQUIRED', 'నివేదిక మరియు సిఫార్సు అవసరం.');
  }
  if (['APPROVE', 'REJECT'].includes(command.action) && !application.recommendation) {
    throw new AppError(422, 'RECOMMENDATION_REQUIRED', 'రెవెన్యూ ఇన్‌స్పెక్టర్ సిఫార్సు అవసరం.');
  }
}
