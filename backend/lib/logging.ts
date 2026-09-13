import pino from "pino";

const logLevel = process.env.LOG_LEVEL || "info";

// Create logger instance
export const logger = pino({
  level: logLevel,
});

// Create child logger with request context
export function createRequestLogger(requestId: string) {
  return logger.child({ requestId });
}

// Log auth events
export function logAuthEvent(
  event: "token_verified" | "token_invalid" | "user_provisioned" | "user_found",
  details: Record<string, unknown>
) {
  logger.info({ event, ...details }, `Auth: ${event}`);
}

// Log errors
export function logError(error: unknown, context?: Record<string, unknown>) {
  if (error instanceof Error) {
    logger.error({ error: error.message, stack: error.stack, ...context }, "Error occurred");
  } else {
    logger.error({ error, ...context }, "Error occurred");
  }
}
