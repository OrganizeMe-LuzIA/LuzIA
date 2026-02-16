export const TOKEN_STORAGE_KEY = "luzia.access_token";
export const EMAIL_STORAGE_KEY = "luzia.email";
export const LEGACY_PHONE_STORAGE_KEY = "luzia.phone";
export const AUTH_SESSION_EXPIRED_EVENT = "luzia:session-expired";

export function clearStoredSession(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  window.localStorage.removeItem(EMAIL_STORAGE_KEY);
  window.localStorage.removeItem(LEGACY_PHONE_STORAGE_KEY);
}

export function notifySessionExpired(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(AUTH_SESSION_EXPIRED_EVENT));
}
