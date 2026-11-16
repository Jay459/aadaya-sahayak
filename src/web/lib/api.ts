export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}
let csrfToken = '';
export function setCsrfToken(value: string): void {
  csrfToken = value;
}
export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body) headers.set('Content-Type', 'application/json');
  if (csrfToken) headers.set('X-CSRF-Token', csrfToken);
  const response = await fetch('/api/v1' + path, {
    ...options,
    headers,
    credentials: 'same-origin',
  });
  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as { code?: string; message?: string };
    throw new ApiError(
      response.status,
      error.code ?? 'REQUEST_FAILED',
      error.message ?? 'అభ్యర్థన పూర్తికాలేదు.',
    );
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'అనుకోని లోపం ఏర్పడింది.';
}
