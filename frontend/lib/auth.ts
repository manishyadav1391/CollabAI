/**
 * Token storage + auth helpers.
 *
 * Phase 1: tokens are stored in localStorage for simplicity. This is a
 * known tradeoff (XSS risk vs. httpOnly cookies) — acceptable to get the
 * flow working now; revisit in Phase 8 hardening if this becomes a real
 * concern for your use case (docs/05-security-compliance.md doesn't
 * mandate cookie storage for v1).
 */

const ACCESS_TOKEN_KEY = "collabai_access_token";
const REFRESH_TOKEN_KEY = "collabai_refresh_token";

export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function isLoggedIn(): boolean {
  return !!getAccessToken();
}

/**
 * Reads the `sub` claim out of the access token for client-side UI gating
 * (e.g. hiding an admin-only button). Not a trust boundary — the server
 * re-checks every role-gated route independently; this only decides what
 * the UI shows before that.
 */
export function getCurrentUserId(): string | null {
  const token = getAccessToken();
  if (!token) return null;

  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return decoded.sub ?? null;
  } catch {
    return null;
  }
}