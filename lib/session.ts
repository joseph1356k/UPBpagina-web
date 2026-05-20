/**
 * Client-side session management for the graduate portal.
 *
 * Uses sessionStorage so the session is automatically cleared when the tab
 * or browser closes. In production this will be replaced by a proper
 * server-side JWT / signed-cookie flow.
 *
 * All functions guard against server-side execution (SSR) by checking
 * `typeof window`.
 */

export interface GraduateSession {
  graduateId: string;
  fullName: string;
  ceremonyId: string;
  ceremonyName: string;
  /** Unix timestamp (ms) when the session expires. */
  expiresAt: number;
}

const SESSION_KEY = "upb_graduate_session";

/** Session TTL: 30 minutes in milliseconds. */
const SESSION_TTL_MS = 30 * 60 * 1_000;

/**
 * Persist a new graduate session in sessionStorage.
 * Automatically sets `expiresAt` 30 minutes from now.
 */
export function saveSession(
  session: Omit<GraduateSession, "expiresAt">,
): void {
  if (typeof window === "undefined") return;
  const data: GraduateSession = {
    ...session,
    expiresAt: Date.now() + SESSION_TTL_MS,
  };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
}

/**
 * Retrieve the current session.
 * Returns `null` if there is no session or if it has expired.
 */
export function getSession(): GraduateSession | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as GraduateSession;
    if (Date.now() > data.expiresAt) {
      clearSession();
      return null;
    }
    return data;
  } catch {
    clearSession();
    return null;
  }
}

/**
 * Remove the graduate session from sessionStorage.
 */
export function clearSession(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SESSION_KEY);
}

/**
 * Returns `true` if there is an active, non-expired session.
 */
export function hasValidSession(): boolean {
  return getSession() !== null;
}
