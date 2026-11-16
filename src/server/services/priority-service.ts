import type { CertificateApplication } from '../../shared/contracts.ts';

export function daysUntilDue(dueAt: string, now: Date): number {
  return Math.ceil((new Date(dueAt).getTime() - now.getTime()) / 86_400_000);
}

/** Priority is a deterministic rule. AI never decides who gets served first. */
export function priorityScore(application: CertificateApplication, now: Date): number {
  const daysLeft = daysUntilDue(application.dueAt, now);
  const overdueDays = Math.max(
    0,
    Math.ceil((now.getTime() - Date.parse(application.dueAt)) / 86_400_000),
  );
  const overdueScore = overdueDays * 10;
  const dueSoonScore = daysLeft >= 0 && daysLeft <= 1 ? 8 : 0;
  return overdueScore + dueSoonScore + (application.returned ? 5 : 0);
}

export function sortByPriority(
  applications: CertificateApplication[],
  now: Date,
): CertificateApplication[] {
  return [...applications].sort(
    (left, right) =>
      priorityScore(right, now) - priorityScore(left, now) ||
      left.dueAt.localeCompare(right.dueAt) ||
      left.id.localeCompare(right.id),
  );
}
