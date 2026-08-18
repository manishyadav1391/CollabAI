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