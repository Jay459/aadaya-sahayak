import { randomBytes } from 'node:crypto';
import type { Officer } from '../../shared/contracts.ts';
import type { Queryable } from '../db/database.ts';
import { hashText } from './audit-service.ts';

export interface ActiveSession {
  officer: Officer;
  csrfToken: string;
}
interface SessionRow {
  id: string;
  username: string;
  name: string;
  role: Officer['role'];
  mandal_id: string;
  village_ids: string[];
  csrf_token: string;
}

export async function createSession(db: Queryable, userId: string) {
  const token = randomBytes(32).toString('hex');
  const csrfToken = randomBytes(32).toString('hex');
  await db.query(
    "INSERT INTO sessions(token_hash,user_id,csrf_token,expires_at) VALUES($1,$2,$3,now() + interval '8 hours')",
    [hashText(token), userId, csrfToken],
  );
  return { token, csrfToken };
}

export async function readSession(db: Queryable, token: string): Promise<ActiveSession | null> {
  const result = await db.query<SessionRow>(
    `
    UPDATE sessions s SET last_seen_at=now() FROM users u
    WHERE s.token_hash=$1 AND s.user_id=u.id AND s.expires_at>now()
      AND s.last_seen_at>now() - interval '30 minutes'
    RETURNING u.id,u.username,u.name,u.role,u.mandal_id,u.village_ids,s.csrf_token`,
    [hashText(token)],
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    officer: {
      id: row.id,
      username: row.username,
      name: row.name,
      role: row.role,
      mandalId: row.mandal_id,
      villageIds: row.village_ids,
    },
    csrfToken: row.csrf_token,
  };
}

export async function revokeSession(db: Queryable, token: string): Promise<void> {
  await db.query('DELETE FROM sessions WHERE token_hash=$1', [hashText(token)]);
}
