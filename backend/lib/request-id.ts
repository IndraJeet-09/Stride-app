import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";

// Generate request ID
export function generateRequestId(): string {
  return `req_${nanoid(12)}`;
}

// Middleware to add request ID
export function withRequestId(
  handler: (req: NextRequest, requestId: string) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const requestId = generateRequestId();
    
    // Add request ID to response headers
    const response = await handler(req, requestId);
    response.headers.set("X-Request-ID", requestId);
    
    return response;
  };
}

// Get request ID from headers or generate new one
export function getRequestId(req: NextRequest): string {
  return req.headers.get("X-Request-ID") || generateRequestId();
}
