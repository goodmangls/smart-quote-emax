const REFRESH_KEY = 'smartQuoteRefresh';

// Access Token: memory only (not accessible via XSS)
let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string): void {
  accessToken = token;
}

export function clearAccessToken(): void {
  accessToken = null;
}

// Refresh Token: localStorage (server-validated, longer-lived)
export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function setRefreshToken(token: string): void {
  localStorage.setItem(REFRESH_KEY, token);
}

export function clearRefreshToken(): void {
  localStorage.removeItem(REFRESH_KEY);
}

export function clearAllTokens(): void {
  accessToken = null;
  localStorage.removeItem(REFRESH_KEY);
  // Migration: remove legacy localStorage token
  localStorage.removeItem('smartQuoteToken');
}
