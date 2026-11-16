import type { Officer } from '../../shared/contracts.ts';
import type { Queryable } from '../db/database.ts';

interface UserRow {
  id: string;
  username: string;
  name: string;
  role: Officer['role'];
  mandal_id: string;
  village_ids: string[];
  password_hash: string;
  locked_until: Date | null;
}

export interface LoginUser {
  officer: Officer;
  passwordHash: string;
  lockedUntil: Date | null;
}

export async function findLoginUser(db: Queryable, username: string): Promise<LoginUser | null> {
  const result = await db.query<UserRow>('SELECT * FROM users WHERE username=$1', [username]);
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
    passwordHash: row.password_hash,
    lockedUntil: row.locked_until,
  };
}

export async function recordLoginFailure(db: Queryable, id: string): Promise<void> {
  await db.query(
    `
    UPDATE users SET
      locked_until = CASE WHEN failed_logins >= 4 THEN now() + interval '15 minutes' ELSE locked_until END,
      failed_logins = CASE WHEN failed_logins >= 4 THEN 0 ELSE failed_logins + 1 END
    WHERE id=$1`,
    [id],
  );
}

export async function clearLoginFailures(db: Queryable, id: string): Promise<void> {
  await db.query('UPDATE users SET failed_logins=0, locked_until=NULL WHERE id=$1', [id]);
}
