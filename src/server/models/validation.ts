import { z } from 'zod';

export const uuidSchema = z.string().uuid();
export const loginSchema = z
  .object({
    username: z.string().trim().min(3).max(80),
    password: z.string().min(1).max(128),
  })
  .strict();

export const reportSchema = z
  .object({
    annualIncome: z.number().int().min(0).max(100_000_000),
    familyMembers: z.number().int().min(1).max(30),
    occupation: z.string().trim().min(2).max(100),
    notes: z.string().trim().min(5).max(2000),
  })
  .strict();

export const transitionSchema = z
  .object({
    action: z.enum(['SUBMIT_REPORT', 'RECOMMEND', 'APPROVE', 'REJECT', 'RETURN']),
    expectedVersion: z.number().int().positive(),
    reason: z.string().trim().min(5).max(1000).optional(),
    reviewedEvidence: z.boolean().optional(),
    report: reportSchema.optional(),
    recommendation: z
      .object({
        action: z.enum(['APPROVE', 'REJECT']),
        note: z.string().trim().min(5).max(1000),
      })
      .strict()
      .optional(),
  })
  .strict()
  .superRefine((command, context) => {
    if (command.report && command.action !== 'SUBMIT_REPORT') {
      context.addIssue({
        code: 'custom',
        message: 'Report is allowed only for SUBMIT_REPORT.',
        path: ['report'],
      });
    }
    if (command.recommendation && command.action !== 'RECOMMEND') {
      context.addIssue({
        code: 'custom',
        message: 'Recommendation is allowed only for RECOMMEND.',
        path: ['recommendation'],
      });
    }
  });

export const aiRequestSchema = z
  .object({
    feature: z.enum(['report', 'discrepancies', 'brief']),
    notes: z.string().trim().max(2000).default(''),
  })
  .strict();

export const aiOutputSchema = z
  .object({
    summary: z.string().min(1).max(1500),
    findings: z
      .array(
        z
          .object({
            note: z.string().min(1).max(400),
            evidence: z.enum([
              'declaredIncome',
              'documentIncome',
              'fieldReport.annualIncome',
              'fieldReport.notes',
              'recommendation.note',
              'officerNotes',
            ]),
          })
          .strict(),
      )
      .max(8),
    report: reportSchema.nullable(),
  })
  .strict();
