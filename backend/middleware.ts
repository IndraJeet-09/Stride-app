import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const allowedOrigins = process.env.CORS_ORIGINS?.split(",") || [];

export function middleware(request: NextRequest) {
  const origin = request.headers.get("Origin") || "";
  const isApi = request.nextUrl.pathname.startsWith("/api/");

  if (!isApi) {
    return NextResponse.next();
  }

  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    const response = new NextResponse(null, { status: 204 });
    if (allowedOrigins.includes(origin)) {
      response.headers.set("Access-Control-Allow-Origin", origin);
    }
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Request-ID");
    response.headers.set("Access-Control-Max-Age", "86400");
    return response;
  }

  const response = NextResponse.next();
  if (allowedOrigins.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  }
  return response;
}

export const config = {
  matcher: "/api/:path*",
};
