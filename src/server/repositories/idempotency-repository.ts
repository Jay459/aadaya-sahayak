import type { Queryable } from '../db/database.ts';
import { AppError } from '../shared/app-error.ts';

export interface TransitionReceipt {
  applicationId: string;
  state: string;
  version: number;
}

export async function reserveReceipt(
  db: Queryable,
  userId: string,
  key: string,
  requestHash: string,
): Promise<TransitionReceipt | null> {
  const inserted = await db.query(
    'INSERT INTO idempotency_receipts(user_id,key,request_hash) VALUES($1,$2,$3) ON CONFLICT DO NOTHING RETURNING key',
    [userId, key, requestHash],
  );
  if (inserted.rowCount === 1) return null;
  const result = await db.query<{ request_hash: string; response: TransitionReceipt | null }>(
    'SELECT request_hash, response FROM idempotency_receipts WHERE user_id=$1 AND key=$2',
    [userId, key],
  );
  const receipt = result.rows[0];
  if (!receipt || receipt.request_hash !== requestHash) {
    throw new AppError(422, 'IDEMPOTENCY_MISMATCH', 'అదే అభ్యర్థన కీని వేరే వివరాలతో ఉపయోగించలేరు.');
  }
  if (!receipt.response)
    throw new AppError(409, 'REQUEST_IN_PROGRESS', 'అభ్యర్థన ప్రాసెస్ అవుతోంది. మళ్లీ ప్రయత్నించండి.');
  return receipt.response;
}

export async function completeReceipt(
  db: Queryable,
  userId: string,
  key: string,
  response: TransitionReceipt,
): Promise<void> {
  await db.query('UPDATE idempotency_receipts SET response=$1 WHERE user_id=$2 AND key=$3', [
    JSON.stringify(response),
    userId,
    key,
  ]);
}
