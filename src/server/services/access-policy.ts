import type { CertificateApplication, Officer } from '../../shared/contracts.ts';
import { AppError } from '../shared/app-error.ts';

export function canAccessApplication(
  officer: Officer,
  application: CertificateApplication,
): boolean {
  if (officer.mandalId !== application.mandalId) return false;
  return officer.role !== 'GPO' || officer.villageIds.includes(application.villageId);
}

export function requireApplicationAccess(
  officer: Officer,
  application: CertificateApplication,
): void {
  if (!canAccessApplication(officer, application)) {
    throw new AppError(404, 'NOT_FOUND', 'దరఖాస్తు అందుబాటులో లేదు.');
  }
}
