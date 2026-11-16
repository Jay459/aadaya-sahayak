import { randomUUID } from 'node:crypto';
import type { AiFeature, AiSuggestion, Officer } from '../../../shared/contracts.ts';
import type { Queryable } from '../../db/database.ts';
import type { ApplicationService } from '../application-service.ts';
import type { AiProvider } from './ai-provider.ts';
import { aiOutputSchema } from '../../models/validation.ts';
import { AppError } from '../../shared/app-error.ts';

const featureRoles = { report: 'GPO', discrepancies: 'RI', brief: 'TAHSILDAR' } as const;

export function createAiService(
  db: Queryable,
  applications: ApplicationService,
  provider: AiProvider,
) {
  async function assist(
    id: string,
    officer: Officer,
    feature: AiFeature,
    notes: string,
  ): Promise<AiSuggestion> {
    const { application } = await applications.detail(id, officer);
    if (featureRoles[feature] !== officer.role) {
      throw new AppError(403, 'ROLE_FORBIDDEN', 'ఈ సహాయం మీ పాత్రకు అందుబాటులో లేదు.');
    }
    const result = aiOutputSchema.parse(
      await provider.generate({
        feature,
        officerNotes: notes,
        declaredIncome: application.declaredIncome,
        documentIncome: application.documentIncome,
        fieldReport: application.fieldReport,
        recommendation: application.recommendation,
      }),
    );
    const suggestion: AiSuggestion = {
      ...result,
      id: randomUUID(),
      feature,
      provider: provider.name,
      disclaimer: 'సూచన మాత్రమే. తుది నిర్ణయం అధికారిదే.',
    };
    await db.query(
      'INSERT INTO ai_suggestions(id,application_id,actor_id,application_version,feature,provider,prompt_version,output) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',
      [
        suggestion.id,
        id,
        officer.id,
        application.version,
        feature,
        provider.name,
        'v1',
        JSON.stringify(suggestion),
      ],
    );
    return suggestion;
  }
  return { assist };
}

export type AiService = ReturnType<typeof createAiService>;
