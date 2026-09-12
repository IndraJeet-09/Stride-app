import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";

interface Auth0Config {
  domain: string;
  issuerBaseUrl: string;
  audience: string;
}

function getConfig(): Auth0Config {
  const domain = process.env.AUTH0_DOMAIN;
  const issuerBaseUrl = process.env.AUTH0_ISSUER_BASE_URL;
  const audience = process.env.AUTH0_AUDIENCE;

  if (!domain || !issuerBaseUrl || !audience) {
    throw new Error("Missing Auth0 configuration: AUTH0_DOMAIN, AUTH0_ISSUER_BASE_URL, AUTH0_AUDIENCE");
  }

  return { domain, issuerBaseUrl, audience };
}

// JWKS endpoint
function getJwksUri(domain: string): string {
  return `https://${domain}/.well-known/jwks.json`;
}

// Cache JWKS keys
let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJwks(): ReturnType<typeof createRemoteJWKSet> {
  if (!jwks) {
    const config = getConfig();
    jwks = createRemoteJWKSet(new URL(getJwksUri(config.domain)));
  }
  return jwks;
}

export interface Auth0TokenPayload extends JWTPayload {
  sub: string;
  email?: string;
  permissions?: string[];
  scope?: string;
}

export interface VerifiedUser {
  sub: string;
  email?: string;
  permissions: string[];
}

export async function verifyToken(token: string): Promise<VerifiedUser> {
  const config = getConfig();
  const jwks = getJwks();

  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer: config.issuerBaseUrl,
      audience: config.audience,
      algorithms: ["RS256"],
    });

    const typedPayload = payload as Auth0TokenPayload;

    // Extract permissions/scope
    const permissions = typedPayload.permissions || [];
    const scope = typedPayload.scope?.split(" ") || [];

    return {
      sub: typedPayload.sub,
      email: typedPayload.email,
      permissions: [...permissions, ...scope],
    };
  } catch (error) {
    // Log error internally but don't expose details to client
    console.error("Token verification failed:", error);
    throw new AuthError("Invalid token");
  }
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

// Check if user has required scope/permission
export function hasPermission(user: VerifiedUser, permission: string): boolean {
  return user.permissions.includes(permission);
}

// Require specific permission
export function requirePermission(user: VerifiedUser, permission: string): void {
  if (!hasPermission(user, permission)) {
    throw new AuthError("Insufficient permissions");
  }
}
