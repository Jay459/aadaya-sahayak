import { z } from 'zod';

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  APP_ORIGIN: z.string().url().default('http://127.0.0.1:5173'),
  DATABASE_URL: z.string().min(1),
  DATABASE_URL_UNPOOLED: z.string().default(''),
  AI_PROVIDER: z.enum(['mock', 'gemini']).default('mock'),
  GEMINI_API_KEY: z.string().default(''),
  GEMINI_MODEL: z
    .string()
    .regex(/^[a-zA-Z0-9.-]+$/)
    .default('gemini-2.5-flash'),
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(1).default(0),
});

export function loadEnvironment(source: NodeJS.ProcessEnv = process.env) {
  const parsed = environmentSchema.safeParse(source);
  if (!parsed.success) {
    // Report key names only. Validation errors can otherwise include secret values.
    throw new Error(
      'Invalid environment keys: ' +
        parsed.error.issues.map((issue) => issue.path.join('.')).join(', '),
    );
  }
  if (parsed.data.AI_PROVIDER === 'gemini' && !parsed.data.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is required when AI_PROVIDER=gemini.');
  }
  if (
    parsed.data.NODE_ENV === 'production' &&
    new URL(parsed.data.APP_ORIGIN).protocol !== 'https:'
  ) {
    throw new Error('APP_ORIGIN must use HTTPS in production.');
  }
  return parsed.data;
}

export type Environment = ReturnType<typeof loadEnvironment>;
