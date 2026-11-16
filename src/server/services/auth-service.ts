import type { Queryable } from '../db/database.ts';
import { AppError } from '../shared/app-error.ts';
import {
  findLoginUser,
  recordLoginFailure,
  clearLoginFailures,
} from '../repositories/user-repository.ts';
import { createSession } from './session-service.ts';
import { hashPassword, verifyPassword } from './password-service.ts';

export function createAuthService(db: Queryable) {
  // Equal work for unknown usernames; do not expose which credential was incorrect.
  const dummyHash = hashPassword('not-a-real-user-password');

  async function login(username: string, password: string) {
    const user = await findLoginUser(db, username);
    const matches = await verifyPassword(password, user?.passwordHash ?? (await dummyHash));
    const locked = user?.lockedUntil && user.lockedUntil.getTime() > Date.now();
    if (!user || !matches || locked) {
      if (user && !locked) await recordLoginFailure(db, user.officer.id);
      throw new AppError(401, 'INVALID_CREDENTIALS', 'లాగిన్ వివరాలు సరికావు లేదా ఖాతా తాత్కాలికంగా లాక్ అయింది.');
    }
    await clearLoginFailures(db, user.officer.id);
    const session = await createSession(db, user.officer.id);
    return { ...session, officer: user.officer };
  }

  return { login };
}
