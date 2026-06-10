import { describe, expect, it, vi, beforeAll } from "vitest";
import {
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
  buildAuthorizationUrl,
  parseIdToken,
  exchangeCodeForTokens,
} from "./pkce";

describe("generateCodeVerifier", () => {
  it("returns a non-empty base64url string of ≥43 chars", () => {
    const v = generateCodeVerifier();
    expect(typeof v).toBe("string");
    expect(v.length).toBeGreaterThanOrEqual(43);
    expect(v).toMatch(/^[A-Za-z0-9\-_]+$/);
  });

  it("returns unique values on successive calls", () => {
    expect(generateCodeVerifier()).not.toBe(generateCodeVerifier());
  });
});

describe("generateCodeChallenge", () => {
  it("produces the correct S256 challenge for a known verifier", async () => {
    // RFC 7636 Appendix B example
    const verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
    const challenge = await generateCodeChallenge(verifier);
    expect(challenge).toBe("E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM");
  });
});

describe("generateState", () => {
  it("returns a non-empty base64url string", () => {
    const s = generateState();
    expect(typeof s).toBe("string");
    expect(s.length).toBeGreaterThan(0);
    expect(s).toMatch(/^[A-Za-z0-9\-_]+$/);
  });
});

describe("buildAuthorizationUrl", () => {
  const config = {
    issuerUrl: "https://auth.example.com",
    clientId: "my-client",
    redirectUri: "http://localhost:3000/callback",
  };

  it("includes all required OAuth2 PKCE params", () => {
    const url = buildAuthorizationUrl(config, "challenge123", "state456");
    const u = new URL(url);
    expect(u.searchParams.get("response_type")).toBe("code");
    expect(u.searchParams.get("client_id")).toBe("my-client");
    expect(u.searchParams.get("redirect_uri")).toBe("http://localhost:3000/callback");
    expect(u.searchParams.get("code_challenge")).toBe("challenge123");
    expect(u.searchParams.get("code_challenge_method")).toBe("S256");
    expect(u.searchParams.get("state")).toBe("state456");
    expect(u.searchParams.get("scope")).toContain("openid");
  });

  it("points to the correct issuer authorization endpoint", () => {
    const url = buildAuthorizationUrl(config, "c", "s");
    expect(url.startsWith("https://auth.example.com/oauth/v2/authorize")).toBe(true);
  });
});

describe("parseIdToken", () => {
  function makeJwt(payload: object): string {
    const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }))
      .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    const body = btoa(JSON.stringify(payload))
      .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    return `${header}.${body}.fakesig`;
  }

  it("extracts sub, email, and name from the payload", () => {
    const jwt = makeJwt({ sub: "user-1", email: "a@b.com", name: "Alice" });
    const claims = parseIdToken(jwt);
    expect(claims.sub).toBe("user-1");
    expect(claims.email).toBe("a@b.com");
    expect(claims.name).toBe("Alice");
  });

  it("extracts Zitadel org claim", () => {
    const jwt = makeJwt({ sub: "u", "urn:zitadel:iam:org:id": "tenant-uuid" });
    expect(parseIdToken(jwt)["urn:zitadel:iam:org:id"]).toBe("tenant-uuid");
  });

  it("throws on invalid JWT", () => {
    expect(() => parseIdToken("not.a.valid.jwt.at.all")).toThrow();
  });
});

describe("exchangeCodeForTokens", () => {
  it("POSTs to the token endpoint and returns tokens", async () => {
    const mockResponse = {
      access_token: "access123",
      id_token: "id456",
      expires_in: 3600,
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })
    );

    const config = {
      issuerUrl: "https://auth.example.com",
      clientId: "client1",
      redirectUri: "http://localhost:3000/callback",
    };
    const result = await exchangeCodeForTokens(config, "code123", "verifier456");
    expect(result.access_token).toBe("access123");
    expect(result.id_token).toBe("id456");

    const call = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(call[0]).toBe("https://auth.example.com/oauth/v2/token");
    expect(call[1].method).toBe("POST");
    vi.unstubAllGlobals();
  });

  it("throws on non-OK response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({ ok: false, status: 400 })
    );
    await expect(
      exchangeCodeForTokens(
        { issuerUrl: "https://x.com", clientId: "c", redirectUri: "http://localhost/cb" },
        "code",
        "verifier"
      )
    ).rejects.toThrow("Token exchange failed: 400");
    vi.unstubAllGlobals();
  });
});
