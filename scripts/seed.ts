import { randomUUID } from 'node:crypto';
import type {
  ApplicationEvent,
  ApplicationState,
  CertificateApplication,
} from '../src/shared/contracts.ts';
import { createDatabase } from '../src/server/db/database.ts';
import { loadEnvironment } from '../src/server/config/env.ts';
import { hashPassword } from '../src/server/services/password-service.ts';
import { eventHash, hashText } from '../src/server/services/audit-service.ts';
import { insertApplication } from '../src/server/repositories/application-repository.ts';
import { appendEvent } from '../src/server/repositories/event-repository.ts';

const password = process.env.DEMO_PASSWORD;
if (!password || password.length < 12)
  throw new Error('Set DEMO_PASSWORD to at least 12 characters before seeding.');
const environment = loadEnvironment();
const database = createDatabase(environment.DATABASE_URL_UNPOOLED || environment.DATABASE_URL);
const passwordHash = await hashPassword(password);
const users = [
  { username: 'gpo.ramaram', name: 'రమేష్', role: 'GPO', villages: ['ramaram'] },
  { username: 'ri.mandal', name: 'శ్రీలత', role: 'RI', villages: [] },
  { username: 'tahsildar.mandal', name: 'అనురాధ', role: 'TAHSILDAR', villages: [] },
];
const names = [
  'లక్ష్మి',
  'రాజు',
  'సునీత',
  'వెంకటేష్',
  'పద్మ',
  'మహేష్',
  'సరిత',
  'రవి',
  'అనిత',
  'ప్రసాద్',
  'మాధవి',
  'శేఖర్',
];
const states: ApplicationState[] = [
  'PENDING_GPO',
  'PENDING_GPO',
  'PENDING_RI',
  'PENDING_TAHSILDAR',
  'PENDING_GPO',
  'PENDING_RI',
  'PENDING_TAHSILDAR',
  'APPROVED',
  'REJECTED',
  'PENDING_RI',
  'PENDING_GPO',
  'PENDING_TAHSILDAR',
];
try {
  await database.transaction(async (client) => {
    const existing = await client.query('SELECT id FROM users LIMIT 1');
    if (existing.rowCount)
      throw new Error('Seed requires an empty database; it never overwrites data.');
    for (const user of users) {
      await client.query(
        'INSERT INTO users(id,username,password_hash,name,role,mandal_id,village_ids) VALUES($1,$2,$3,$4,$5,$6,$7)',
        [
          randomUUID(),
          user.username,
          passwordHash,
          user.name,
          user.role,
          'mandal-demo',
          user.villages,
        ],
      );
    }
    for (let index = 0; index < names.length; index++) {
      const id = randomUUID();
      const now = Date.now();
      const state = states[index]!;
      const income = 90000 + index * 10000;
      const report = {
        annualIncome: index === 2 ? income + 50000 : income,
        familyMembers: 4,
        occupation: 'వ్యవసాయ కూలీ',
        notes: 'కుటుంబ సభ్యులను కలిసి ఆదాయ వివరాలు సేకరించాం.',
      };
      const application: CertificateApplication = {
        id,
        reference: 'DEMO-IC-' + String(index + 1).padStart(4, '0'),
        applicantName: names[index]! + ' (నమూనా)',
        villageName: index === 10 ? 'కొండాపూర్' : 'రామారం',
        villageId: index === 10 ? 'kondapur' : 'ramaram',
        mandalId: 'mandal-demo',
        purpose: index % 2 === 0 ? 'విద్యార్థి ఉపకార వేతనం' : 'ఫీజు రీయింబర్స్‌మెంట్',
        declaredIncome: income,
        documentIncome: index === 2 ? income + 40000 : income,
        state,
        version: 1,
        submittedAt: new Date(now - 8 * 86400000).toISOString(),
        dueAt: new Date(now + ((index % 6) - 2) * 86400000).toISOString(),
        returned: index === 5,
        fieldReport: state === 'PENDING_GPO' ? null : report,
        recommendation: ['PENDING_TAHSILDAR', 'APPROVED', 'REJECTED'].includes(state)
          ? { action: 'APPROVE', note: 'క్షేత్ర నివేదిక పరిశీలించి తుది సమీక్షకు పంపుతున్నాం.' }
          : null,
      };
      await insertApplication(client, application);
      const event: Omit<ApplicationEvent, 'hash'> = {
        id: randomUUID(),
        applicationId: id,
        actorName: 'నమూనా డేటా',
        actorRole: 'SYSTEM',
        action: 'DEMO_IMPORTED',
        fromState: null,
        toState: state,
        reason: 'కల్పిత ప్రదర్శన దరఖాస్తు. పూర్వ దశలు నమూనాగా దిగుమతి చేయబడ్డాయి.',
        createdAt: new Date(now).toISOString(),
        previousHash: hashText(id),
      };
      await appendEvent(client, { ...event, hash: eventHash(event) });
    }
  });
  console.info(
    'Seeded 3 officers and 12 fictional applications. Password comes from DEMO_PASSWORD.',
  );
} finally {
  await database.pool.end();
}
