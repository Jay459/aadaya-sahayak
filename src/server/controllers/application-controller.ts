import type { RequestHandler } from 'express';
import { uuidSchema, transitionSchema } from '../models/validation.ts';
import { getSession } from '../middleware/authentication.ts';
import type { ApplicationService } from '../services/application-service.ts';

export function createApplicationController(service: ApplicationService) {
  const list: RequestHandler = async (_request, response) => {
    response.json({ applications: await service.list(getSession(response).officer) });
  };
  const detail: RequestHandler = async (request, response) => {
    const id = uuidSchema.parse(request.params.id);
    response.json(await service.detail(id, getSession(response).officer));
  };
  const transition: RequestHandler = async (request, response) => {
    const id = uuidSchema.parse(request.params.id);
    const key = uuidSchema.parse(request.get('Idempotency-Key'));
    const command = transitionSchema.parse(request.body);
    response.json(await service.transition(id, getSession(response).officer, key, command));
  };
  return { list, detail, transition };
}
