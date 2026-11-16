import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import type { Officer, TransitionCommand } from '../../src/shared/contracts.ts';
import { application, officer } from '../fixtures.ts';

test(
  'PostgreSQL: workflow, replay, race, rollback and immutable history',
  { skip: !process.env.TEST_DATABASE_URL },
  async (context) => {
    const { createDatabase } = await import('../../src/server/db/database.ts');
    const { createApplicationService } =
      await import('../../src/server/services/application-service.ts');
    const { insertApplication, findApplication } =
      await import('../../src/server/repositories/application-repository.ts');
    const { listEvents } = await import('../../src/server/repositories/event-repository.ts');
    const schema = 'test_' + randomUUID().replaceAll('-', '');
    const baseUrl = process.env.TEST_DATABASE_URL!;
    const admin = createDatabase(baseUrl);
    await admin.pool.query('CREATE SCHEMA ' + schema);
    const scopedUrl = new URL(baseUrl);
    scopedUrl.searchParams.set('options', '-c search_path=' + schema);
    const database = createDatabase(scopedUrl.toString());
    context.after(async () => {
      await database.pool.end();
      await admin.pool.query('DROP SCHEMA ' + schema + ' CASCADE');
      await admin.pool.end();
    });
    await database.pool.query(
      await readFile(
        new URL('../../src/server/db/migrations/001_initial.sql', import.meta.url),
        'utf8',
      ),
    );
    const gpo = { ...officer, id: randomUUID() };
    const ri: Officer = { ...officer, id: randomUUID(), username: 'test.ri', role: 'RI' };
    const tahsildar: Officer = {
      ...officer,
      id: randomUUID(),
      username: 'test.tahsildar',
      role: 'TAHSILDAR',
    };
    for (const user of [gpo, ri, tahsildar]) {
      await database.pool.query(
        'INSERT INTO users(id,username,password_hash,name,role,mandal_id,village_ids) VALUES($1,$2,$3,$4,$5,$6,$7)',
        [
          user.id,
          user.username,
          'not-used-by-service-test',
          user.name,
          user.role,
          user.mandalId,
          user.villageIds,
        ],
      );
    }
    const service = createApplicationService(database);
    const report = {
      annualIncome: 100000,
      familyMembers: 4,
      occupation: 'Worker',
      notes: 'Visited household and checked evidence.',
    };

    await context.test('full return/correction/recommendation/approval journey', async () => {
      const item = application({ id: randomUUID() });
      await insertApplication(database.pool, item);
      await service.transition(item.id, gpo, randomUUID(), {
        action: 'SUBMIT_REPORT',
        expectedVersion: 1,
        report,
      });
      await service.transition(item.id, ri, randomUUID(), {
        action: 'RETURN',
        expectedVersion: 2,
        reason: 'Please confirm income evidence.',
      });
      await service.transition(item.id, gpo, randomUUID(), {
        action: 'SUBMIT_REPORT',
        expectedVersion: 3,
        report,
      });
      await service.transition(item.id, ri, randomUUID(), {
        action: 'RECOMMEND',
        expectedVersion: 4,
        recommendation: { action: 'APPROVE', note: 'Evidence reviewed.' },
      });
      await service.transition(item.id, tahsildar, randomUUID(), {
        action: 'APPROVE',
        expectedVersion: 5,
        reason: 'Evidence supports decision.',
        reviewedEvidence: true,
      });
      const detail = await service.detail(item.id, tahsildar);
      assert.equal(detail.application.state, 'APPROVED');
      assert.equal(detail.events.length, 5);
      assert.equal(detail.auditIntact, true);
    });

    await context.test('same-key retry replays exactly once; different payload fails', async () => {
      const item = application({ id: randomUUID() });
      await insertApplication(database.pool, item);
      const key = randomUUID();
      const command: TransitionCommand = { action: 'SUBMIT_REPORT', expectedVersion: 1, report };
      const first = await service.transition(item.id, gpo, key, command);
      assert.deepEqual(await service.transition(item.id, gpo, key, command), first);
      assert.equal((await listEvents(database.pool, item.id)).length, 1);
      await assert.rejects(
        () =>
          service.transition(item.id, gpo, key, {
            ...command,
            report: { ...report, annualIncome: 200000 },
          }),
        { status: 422 },
      );
    });

    await context.test('20 simultaneous approvals create exactly one decision', async () => {
      const item = application({
        id: randomUUID(),
        state: 'PENDING_TAHSILDAR',
        fieldReport: report,
        recommendation: { action: 'APPROVE', note: 'Evidence reviewed.' },
      });
      await insertApplication(database.pool, item);
      const outcomes = await Promise.allSettled(
        Array.from({ length: 20 }, () =>
          service.transition(item.id, tahsildar, randomUUID(), {
            action: 'APPROVE',
            expectedVersion: 1,
            reason: 'All evidence reviewed.',
            reviewedEvidence: true,
          }),
        ),
      );
      assert.equal(outcomes.filter((result) => result.status === 'fulfilled').length, 1);
      const failures = outcomes.filter((result) => result.status === 'rejected');
      assert.equal(failures.length, 19);
      for (const result of failures)
        assert.equal((result.reason as { status: number }).status, 409);
      assert.equal((await listEvents(database.pool, item.id)).length, 1);
    });

    await context.test('history failure rolls back state and retry receipt', async () => {
      const item = application({ id: randomUUID() });
      await insertApplication(database.pool, item);
      // id is generated locally by randomUUID, never taken from a request.
      await database.pool.query(
        "ALTER TABLE application_events ADD CONSTRAINT reject_fixture CHECK (application_id <> '" +
          item.id +
          "'::uuid)",
      );
      const key = randomUUID();
      await assert.rejects(() =>
        service.transition(item.id, gpo, key, {
          action: 'SUBMIT_REPORT',
          expectedVersion: 1,
          report,
        }),
      );
      assert.equal((await findApplication(database.pool, item.id))?.version, 1);
      const receipts = await database.pool.query(
        'SELECT key FROM idempotency_receipts WHERE key=$1',
        [key],
      );
      assert.equal(receipts.rowCount, 0);
      await database.pool.query('ALTER TABLE application_events DROP CONSTRAINT reject_fixture');
    });

    await context.test('audit events cannot be updated or deleted', async () => {
      await assert.rejects(() =>
        database.pool.query("UPDATE application_events SET hash='changed'"),
      );
      await assert.rejects(() => database.pool.query('DELETE FROM application_events'));
    });
  },
);
