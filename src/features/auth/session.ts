import type { AuthUser } from './schemas';

export const SESSION_COOKIE = 'trading_session';

// Readable by the browser on purpose: the client attaches it as a bearer token and
// the proxy reads it to gate routes. The API remains the only real authority.
const MAX_AGE_SECONDS = 2 * 60 * 60;

export function readToken(): string | undefined {
  if (typeof document === 'undefined') return undefined;
  return document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${SESSION_COOKIE}=`))
    ?.slice(SESSION_COOKIE.length + 1);
}

export function saveToken(token: string): void {
  const secure = location.protocol === 'https:' ? '; secure' : '';
  document.cookie = `${SESSION_COOKIE}=${token}; path=/; max-age=${MAX_AGE_SECONDS}; samesite=lax${secure}`;
}

export function clearToken(): void {
  document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0; samesite=lax`;
}

function isTokenPayload(value: unknown): value is { sub: string; email: string; name: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'sub' in value &&
    typeof value.sub === 'string' &&
    'email' in value &&
    typeof value.email === 'string' &&
    'name' in value &&
    typeof value.name === 'string'
  );
}

export function readUser(token: string): AuthUser | null {
  try {
    const payload: unknown = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return isTokenPayload(payload) ? { id: payload.sub, email: payload.email, name: payload.name } : null;
  } catch {
    return null;
  }
}
