const ACCESS_TOKEN_KEY = "tas_access_token";
const ID_TOKEN_KEY = "tas_id_token";
const USER_KEY = "tas_user";

function storage(): Storage | null {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

export function storeTokens(accessToken: string, idToken: string): void {
  const s = storage();
  if (!s) return;
  s.setItem(ACCESS_TOKEN_KEY, accessToken);
  s.setItem(ID_TOKEN_KEY, idToken);
}

export function getAccessToken(): string | null {
  return storage()?.getItem(ACCESS_TOKEN_KEY) ?? null;
}

export function getIdToken(): string | null {
  return storage()?.getItem(ID_TOKEN_KEY) ?? null;
}

export function clearTokens(): void {
  const s = storage();
  if (!s) return;
  s.removeItem(ACCESS_TOKEN_KEY);
  s.removeItem(ID_TOKEN_KEY);
  s.removeItem(USER_KEY);
}
