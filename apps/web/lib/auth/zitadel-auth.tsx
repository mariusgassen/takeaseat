"use client";
import * as React from "react";
import { AuthContext } from "./context";
import type { AuthUser, AuthContextValue, Role } from "./types";
import {
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
  buildAuthorizationUrl,
  exchangeCodeForTokens,
  parseIdToken,
} from "./pkce";
import { storeTokens, getAccessToken, getIdToken, clearTokens } from "./token-storage";
import { setAuthToken, clearAuthToken } from "@/lib/api/client";

const ISSUER_URL = process.env.NEXT_PUBLIC_ZITADEL_ISSUER_URL ?? "";
const CLIENT_ID = process.env.NEXT_PUBLIC_ZITADEL_CLIENT_ID ?? "";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const VERIFIER_KEY = "zitadel_pkce_verifier";
const STATE_KEY = "zitadel_pkce_state";

const VALID_ROLES: Set<string> = new Set(["admin", "manager", "member", "guest"]);

function toRole(raw: string | undefined): Role {
  if (raw && VALID_ROLES.has(raw)) return raw as Role;
  return "member";
}

function buildUserFromIdToken(idToken: string): AuthUser | null {
  try {
    const claims = parseIdToken(idToken);
    const roles = claims["urn:zitadel:iam:roles"];
    const firstRole = roles ? Object.keys(roles)[0] : undefined;
    return {
      id: claims.sub,
      name: claims.name ?? claims.email ?? claims.sub,
      email: claims.email ?? "",
      role: toRole(firstRole),
      tenantId: claims["urn:zitadel:iam:org:id"] ?? "",
      tenantSlug: "",
      tenantName: "",
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const accessToken = getAccessToken();
    const idToken = getIdToken();
    if (accessToken && idToken) {
      const parsed = buildUserFromIdToken(idToken);
      if (parsed) {
        setAuthToken(accessToken);
        setUser(parsed);
      } else {
        clearTokens();
        clearAuthToken();
      }
    }
    setLoading(false);
  }, []);

  const signIn = React.useCallback(async () => {
    const verifier = generateCodeVerifier();
    const challenge = await generateCodeChallenge(verifier);
    const state = generateState();
    sessionStorage.setItem(VERIFIER_KEY, verifier);
    sessionStorage.setItem(STATE_KEY, state);
    window.location.href = buildAuthorizationUrl(
      { issuerUrl: ISSUER_URL, clientId: CLIENT_ID, redirectUri: `${APP_URL}/callback` },
      challenge,
      state
    );
  }, []);

  const signOut = React.useCallback(() => {
    clearTokens();
    clearAuthToken();
    setUser(null);
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      post_logout_redirect_uri: `${APP_URL}/login`,
    });
    window.location.href = `${ISSUER_URL}/oidc/v1/end_session?${params.toString()}`;
  }, []);

  const value = React.useMemo<AuthContextValue>(
    () => ({ user, loading, signIn, signOut }),
    [user, loading, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { useAuth } from "./context";

export async function handleOAuthCallback(
  code: string,
  state: string
): Promise<AuthUser> {
  const storedState = sessionStorage.getItem(STATE_KEY);
  const verifier = sessionStorage.getItem(VERIFIER_KEY);

  if (state !== storedState || !verifier) {
    throw new Error("Invalid OAuth state");
  }

  sessionStorage.removeItem(STATE_KEY);
  sessionStorage.removeItem(VERIFIER_KEY);

  const tokens = await exchangeCodeForTokens(
    { issuerUrl: ISSUER_URL, clientId: CLIENT_ID, redirectUri: `${APP_URL}/callback` },
    code,
    verifier
  );

  storeTokens(tokens.access_token, tokens.id_token);
  setAuthToken(tokens.access_token);

  const parsed = buildUserFromIdToken(tokens.id_token);
  if (!parsed) throw new Error("Failed to parse identity token");
  return parsed;
}
