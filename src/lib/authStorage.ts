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

// Refresh Token: HttpOnly Secure cookie managed by the Rails API.
// It is intentionally unreadable from JavaScript to reduce XSS token theft risk.
export function getRefreshToken(): string | null {
  return null;
}

export function setRefreshToken(token: string): void {
  void token;
  // No-op kept for temporary compatibility with older call sites/API payloads.
}

export function clearRefreshToken(): void {
  localStorage.removeItem('smartQuoteRefresh');
}

export function clearAllTokens(): void {
  accessToken = null;
  localStorage.removeItem('smartQuoteRefresh');
  // Migration: remove legacy localStorage token
  localStorage.removeItem('smartQuoteToken');
}
