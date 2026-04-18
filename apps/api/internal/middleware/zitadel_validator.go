package middleware

import (
	"context"
	"crypto/rsa"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"math/big"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

var ErrInvalidToken = errors.New("invalid token")
var ErrInvalidIssuer = errors.New("invalid issuer")
var ErrTokenExpired = errors.New("token expired")

type JWKS struct {
	Keys []JWK `json:"keys"`
}

type JWK struct {
	Kid string `json:"kid"`
	Kty string `json:"kty"`
	Alg string `json:"alg"`
	Use string `json:"use"`
	N   string `json:"n"`
	E   string `json:"e"`
}

type ZitadelValidator struct {
	issuerURL string
	jwks      *JWKS
	mu        sync.RWMutex
	httpClient *http.Client
	fetchedAt time.Time
	cacheTTL  time.Duration
}

func NewZitadelValidator(issuerURL string) *ZitadelValidator {
	return &ZitadelValidator{
		issuerURL:  strings.TrimSuffix(issuerURL, "/"),
		httpClient: &http.Client{Timeout: 10 * time.Second},
		cacheTTL:   1 * time.Hour,
	}
}

func (v *ZitadelValidator) Validate(ctx context.Context, rawToken string) (*Claims, error) {
	if err := v.ensureJWKS(ctx); err != nil {
		return nil, fmt.Errorf("failed to fetch JWKS: %w", err)
	}

	parts := strings.Split(rawToken, ".")
	if len(parts) != 3 {
		return nil, ErrInvalidToken
	}

	headerB64, payloadB64, _ := parts[0], parts[1], parts[2]
	header, err := v.decodeBase64URL([]byte(headerB64))
	if err != nil {
		return nil, fmt.Errorf("invalid token header: %w", err)
	}

	var headerObj struct {
		Alg string `json:"alg"`
		Kid string `json:"kid"`
		Typ string `json:"typ"`
	}
	if err := json.Unmarshal(header, &headerObj); err != nil {
		return nil, ErrInvalidToken
	}

	payload, err := v.decodeBase64URL([]byte(payloadB64))
	if err != nil {
		return nil, fmt.Errorf("invalid token payload: %w", err)
	}

	var claims struct {
		Issuer    string `json:"iss"`
		Subject   string `json:"sub"`
		Audience  any    `json:"aud"`
		Expiry    int64  `json:"exp"`
		IssuedAt  int64  `json:"iat"`
		TenantID  string `json:"urn:zitadel:iam:org:id"`
		Role      string `json:"urn:zitadel:iam:role"`
	}
	if err := json.Unmarshal(payload, &claims); err != nil {
		return nil, ErrInvalidToken
	}

	if claims.Expiry > 0 && time.Now().Unix() > claims.Expiry {
		return nil, ErrTokenExpired
	}

	if v.issuerURL != "" && claims.Issuer != v.issuerURL {
		return nil, ErrInvalidIssuer
	}

	if claims.TenantID == "" {
		return nil, fmt.Errorf("missing tenant_id claim")
	}

	role := strings.ToLower(claims.Role)
	if role == "" {
		role = "member"
	}

	return &Claims{
		Subject:  claims.Subject,
		TenantID: claims.TenantID,
		Role:    role,
	}, nil
}

func (v *ZitadelValidator) ensureJWKS(ctx context.Context) error {
	v.mu.RLock()
	if v.jwks != nil && time.Since(v.fetchedAt) < v.cacheTTL {
		v.mu.RUnlock()
		return nil
	}
	v.mu.RUnlock()

	v.mu.Lock()
	defer v.mu.Unlock()

	if v.jwks != nil && time.Since(v.fetchedAt) < v.cacheTTL {
		return nil
	}

	jwksURL := v.issuerURL + "/oauth/token_key"
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, jwksURL, nil)
	if err != nil {
		return err
	}

	resp, err := v.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("JWKS fetch failed: %d", resp.StatusCode)
	}

	var jwks JWKS
	if err := json.NewDecoder(resp.Body).Decode(&jwks); err != nil {
		return err
	}

	v.jwks = &jwks
	v.fetchedAt = time.Now()

	return nil
}

func (v *ZitadelValidator) GetKey(kid string) (*rsa.PublicKey, error) {
	v.mu.RLock()
	defer v.mu.RUnlock()

	for _, key := range v.jwks.Keys {
		if key.Kid == kid && key.Kty == "RSA" {
			return v.parseRSAPublicKey(key.N, key.E)
		}
	}
	return nil, fmt.Errorf("key not found: %s", kid)
}

func (v *ZitadelValidator) decodeBase64URL(data []byte) ([]byte, error) {
	switch len(data) % 4 {
	case 2:
		data = append(data, '=', '=')
	case 3:
		data = append(data, '=')
	}
	result := make([]byte, base64.URLEncoding.DecodedLen(len(data)))
	n, err := base64.URLEncoding.Decode(result, data)
	if err != nil {
		return nil, err
	}
	return result[:n], nil
}

func (v *ZitadelValidator) parseRSAPublicKey(nB64, eB64 string) (*rsa.PublicKey, error) {
	nBytes, err := base64.RawURLEncoding.DecodeString(nB64)
	if err != nil {
		return nil, err
	}
	eBytes, err := base64.RawURLEncoding.DecodeString(eB64)
	if err != nil {
		return nil, err
	}

	var n big.Int
	var e int
	n.SetBytes(nBytes)
	e = int(eBytes[0])
	if len(eBytes) > 1 {
		e = 0
		for _, b := range eBytes {
			e = e<<8 | int(b)
		}
	}

	return &rsa.PublicKey{N: &n, E: e}, nil
}

func WithTenantDB(pool *pgxpool.Pool) func(context.Context) error {
	return func(ctx context.Context) error {
		tenantID := GetTenantIDFromContext(ctx)
		if tenantID == "" {
			return nil
		}
		_, err := pool.Exec(ctx, "SET LOCAL app.tenant_id = $1", tenantID)
		return err
	}
}

func GetTenantIDFromContext(ctx context.Context) string {
	if v := ctx.Value(TenantIDKey); v != nil {
		if s, ok := v.(string); ok {
			return s
		}
	}
	return ""
}