import type { RequestHandler } from 'express';
import type { AiService } from '../services/ai/ai-service.ts';
import { uuidSchema, aiRequestSchema } from '../models/validation.ts';
import { getSession } from '../middleware/authentication.ts';

export function createAiController(service: AiService): RequestHandler {
  return async (request, response) => {
    const id = uuidSchema.parse(request.params.id);
    const input = aiRequestSchema.parse(request.body);
    response.json(
      await service.assist(id, getSession(response).officer, input.feature, input.notes),
    );
  };
}
