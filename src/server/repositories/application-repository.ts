import type { Queryable } from '../db/database.ts';
import type { ApplicationState, CertificateApplication, Officer } from '../../shared/contracts.ts';

interface ApplicationRow {
  id: string;
  mandal_id: string;
  village_id: string;
  state: ApplicationState;
  version: number;
  payload: Omit<CertificateApplication, 'id' | 'mandalId' | 'villageId' | 'state' | 'version'>;
}

function mapApplication(row: ApplicationRow): CertificateApplication {
  return {
    ...row.payload,
    id: row.id,
    mandalId: row.mandal_id,
    villageId: row.village_id,
    state: row.state,
    version: row.version,
  };
}

export async function findApplication(
  db: Queryable,
  id: string,
): Promise<CertificateApplication | null> {
  const result = await db.query<ApplicationRow>('SELECT * FROM applications WHERE id = $1', [id]);
  return result.rows[0] ? mapApplication(result.rows[0]) : null;
}

export async function listApplications(
  db: Queryable,
  officer: Officer,
): Promise<CertificateApplication[]> {
  const result = await db.query<ApplicationRow>(
    "SELECT * FROM applications WHERE mandal_id = $1 AND ($2::text <> 'GPO' OR village_id = ANY($3::text[])) ORDER BY id LIMIT 200",
    [officer.mandalId, officer.role, officer.villageIds],
  );
  return result.rows.map(mapApplication);
}

export async function updateApplication(
  db: Queryable,
  application: CertificateApplication,
  expectedVersion: number,
): Promise<boolean> {
  const {
    id,
    mandalId: _mandalId,
    villageId: _villageId,
    state,
    version,
    ...payload
  } = application;
  const result = await db.query(
    'UPDATE applications SET state = $1, version = $2, payload = $3 WHERE id = $4 AND version = $5',
    [state, version, JSON.stringify(payload), id, expectedVersion],
  );
  return result.rowCount === 1;
}

export async function insertApplication(
  db: Queryable,
  application: CertificateApplication,
): Promise<void> {
  const { id, mandalId, villageId, state, version, ...payload } = application;
  await db.query(
    'INSERT INTO applications(id, mandal_id, village_id, state, version, payload) VALUES($1,$2,$3,$4,$5,$6)',
    [id, mandalId, villageId, state, version, JSON.stringify(payload)],
  );
}
