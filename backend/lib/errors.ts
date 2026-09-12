import { NextResponse } from "next/server";

// Error codes
export const ErrorCode = {
  UNAUTHENTICATED: "UNAUTHENTICATED",
  FORBIDDEN: "FORBIDDEN",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  NOT_FOUND: "NOT_FOUND",
  RUN_NOT_FOUND: "RUN_NOT_FOUND",
  INVALID_RUN_STATE: "INVALID_RUN_STATE",
  DUPLICATE_CLIENT_RUN: "DUPLICATE_CLIENT_RUN",
  INVALID_GPS_POINT: "INVALID_GPS_POINT",
  RATE_LIMITED: "RATE_LIMITED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

// Custom error class
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;

  constructor(code: ErrorCode, message: string, statusCode: number = 500) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
  }
}

// Specific error factories
export function notFoundError(message: string = "Resource not found"): AppError {
  return new AppError(ErrorCode.NOT_FOUND, message, 404);
}

export function runNotFoundError(): AppError {
  return new AppError(ErrorCode.RUN_NOT_FOUND, "Run not found", 404);
}

export function invalidRunStateError(message: string): AppError {
  return new AppError(ErrorCode.INVALID_RUN_STATE, message, 409);
}

export function duplicateClientRunError(): AppError {
  return new AppError(
    ErrorCode.DUPLICATE_CLIENT_RUN,
    "Run with this client ID already exists",
    409
  );
}

export function authenticationError(message: string = "Authentication required"): AppError {
  return new AppError(ErrorCode.UNAUTHENTICATED, message, 401);
}

export function forbiddenError(message: string = "Access denied"): AppError {
  return new AppError(ErrorCode.FORBIDDEN, message, 403);
}

export function validationError(message: string): AppError {
  return new AppError(ErrorCode.VALIDATION_ERROR, message, 400);
}

export function rateLimitError(): AppError {
  return new AppError(ErrorCode.RATE_LIMITED, "Too many requests", 429);
}

export function internalError(message: string = "Internal server error"): AppError {
  return new AppError(ErrorCode.INTERNAL_ERROR, message, 500);
}

// Error response format
export interface ErrorResponse {
  error: {
    code: ErrorCode;
    message: string;
    requestId?: string;
  };
}

// Create error response
export function createErrorResponse(
  code: ErrorCode,
  message: string,
  statusCode: number,
  requestId?: string
): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        requestId,
      },
    },
    { status: statusCode }
  );
}

// Handle errors in route handlers
export function handleApiError(
  error: unknown,
  requestId?: string
): NextResponse<ErrorResponse> {
  if (error instanceof AppError) {
    return createErrorResponse(error.code, error.message, error.statusCode, requestId);
  }

  console.error("Unhandled error:", error);
  return createErrorResponse(
    ErrorCode.INTERNAL_ERROR,
    "Internal server error",
    500,
    requestId
  );
}
