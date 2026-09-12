import { NextRequest } from "next/server";
import { verifyToken, type VerifiedUser } from "@/lib/auth0";
import { authenticationError } from "@/lib/errors";

// Extract token from Authorization header
function extractToken(req: NextRequest): string | null {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.slice(7);
}

// Require authentication - throws if not authenticated
export async function requireAuth(req: NextRequest): Promise<VerifiedUser> {
  const token = extractToken(req);
  if (!token) {
    throw authenticationError("Missing authorization token");
  }

  try {
    const user = await verifyToken(token);
    return user;
  } catch (error) {
    throw authenticationError("Invalid or expired token");
  }
}

// Optional authentication - returns null if not authenticated
export async function getAuthUser(req: NextRequest): Promise<VerifiedUser | null> {
  const token = extractToken(req);
  if (!token) {
    return null;
  }

  try {
    return await verifyToken(token);
  } catch {
    return null;
  }
}

// Check if user has required permission
export function requirePermission(user: VerifiedUser, permission: string): void {
  if (!user.permissions.includes(permission)) {
    throw authenticationError("Insufficient permissions");
  }
}
