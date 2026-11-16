import { createHash } from 'node:crypto';
import type { ApplicationEvent } from '../../shared/contracts.ts';

export function hashText(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

/** Stable key ordering also makes idempotency insensitive to JSON property order. */
export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

export function eventHash(event: Omit<ApplicationEvent, 'hash'>): string {
  return hashText(canonicalJson(event));
}

export function verifyAuditChain(applicationId: string, events: ApplicationEvent[]): boolean {
  let previousHash = hashText(applicationId);
  for (const event of events) {
    const { hash, ...payload } = event;
    if (
      event.applicationId !== applicationId ||
      event.previousHash !== previousHash ||
      eventHash(payload) !== hash
    )
      return false;
    previousHash = hash;
  }
  return true;
}
