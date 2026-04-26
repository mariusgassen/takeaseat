function base64urlEncode(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

export function generateCodeVerifier(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return base64urlEncode(bytes.buffer);
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoded = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return base64urlEncode(digest);
}

export function generateState(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return base64urlEncode(bytes.buffer);
}

export interface OidcConfig {
  issuerUrl: string;
  clientId: string;
  redirectUri: string;
}

export function buildAuthorizationUrl(
  config: OidcConfig,
  codeChallenge: string,
  state: string
): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: "openid profile email",
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state,
  });
  return `${config.issuerUrl}/oauth/v2/authorize?${params.toString()}`;
}

export interface TokenResponse {
  access_token: string;
  id_token: string;
  expires_in: number;
}

export async function exchangeCodeForTokens(
  config: OidcConfig,
  code: string,
  codeVerifier: string
): Promise<TokenResponse> {
  const res = await fetch(`${config.issuerUrl}/oauth/v2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: config.redirectUri,
      client_id: config.clientId,
      code_verifier: codeVerifier,
    }).toString(),
  });
  if (!res.ok) {
    throw new Error(`Token exchange failed: ${res.status}`);
  }
  return res.json() as Promise<TokenResponse>;
}

export interface ZitadelClaims {
  sub: string;
  email?: string;
  name?: string;
  "urn:zitadel:iam:org:id"?: string;
  "urn:zitadel:iam:roles"?: Record<string, Record<string, string>>;
  exp?: number;
}

export function parseIdToken(idToken: string): ZitadelClaims {
  const parts = idToken.split(".");
  if (parts.length !== 3) throw new Error("Invalid JWT format");
  const payload = parts[1]!.replace(/-/g, "+").replace(/_/g, "/");
  const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
  return JSON.parse(atob(padded)) as ZitadelClaims;
}
