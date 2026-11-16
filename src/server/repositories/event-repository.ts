import type { ApplicationEvent } from '../../shared/contracts.ts';
import type { Queryable } from '../db/database.ts';

export async function listEvents(
  db: Queryable,
  applicationId: string,
): Promise<ApplicationEvent[]> {
  const result = await db.query<{ payload: ApplicationEvent; hash: string }>(
    'SELECT payload, hash FROM application_events WHERE application_id = $1 ORDER BY sequence',
    [applicationId],
  );
  return result.rows.map((row) => ({ ...row.payload, hash: row.hash }));
}

export async function appendEvent(db: Queryable, event: ApplicationEvent): Promise<void> {
  const { hash, ...payload } = event;
  await db.query(
    'INSERT INTO application_events(id, application_id, payload, hash) VALUES($1,$2,$3,$4)',
    [event.id, event.applicationId, JSON.stringify(payload), hash],
  );
}
