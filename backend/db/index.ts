import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

// Connection pool for production
const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  onnotice: () => {},
});

export const db = drizzle(client, { schema });

// Gracefully close connections before process exits
async function shutdown() {
  try {
    await client.end({ timeout: 5000 });
  } catch {
    // Ignore errors during shutdown
  }
}

process.on("beforeExit", () => {
  shutdown();
});

// For testing - create a new connection
export function createTestDb(url: string) {
  const testClient = postgres(url);
  return drizzle(testClient, { schema });
}
