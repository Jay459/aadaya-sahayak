import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mockProvider } from '../../src/server/services/ai/mock-provider.ts';

test('demo AI labels factual mismatches and cites existing evidence', async () => {
  const result = await mockProvider.generate({
    feature: 'discrepancies',
    declaredIncome: 100000,
    documentIncome: 150000,
    fieldReport: null,
    recommendation: null,
    officerNotes: '',
  });
  assert.equal(mockProvider.name, 'mock');
  assert.equal(result.findings.length, 1);
  assert.equal(result.findings[0]?.evidence, 'documentIncome');
  assert.equal(result.report, null);
});
