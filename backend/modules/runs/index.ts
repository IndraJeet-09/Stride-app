import { db } from "@/db";
import { runs, type Run } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

// Get run by ID (with ownership check)
export async function getRunById(
  userId: string,
  runId: string
): Promise<Run | null> {
  const result = await db.query.runs.findFirst({
    where: and(eq(runs.id, runId), eq(runs.userId, userId)),
  });
  return result ?? null;
}

// Get user's runs (paginated)
export async function getUserRuns(
  userId: string,
  options: {
    page?: number;
    limit?: number;
    from?: Date;
    to?: Date;
    sort?: "asc" | "desc";
  } = {}
): Promise<{ runs: Run[]; total: number }> {
  const { page = 1, limit = 20, from, to, sort = "desc" } = options;

  const conditions = [eq(runs.userId, userId)];

  // Get total count
  const allRuns = await db.query.runs.findMany({
    where: and(...conditions),
  });
  const total = allRuns.length;

  // Get paginated runs
  const paginatedRuns = await db.query.runs.findMany({
    where: and(...conditions),
    orderBy: sort === "desc" ? desc(runs.startedAt) : runs.startedAt,
    limit,
    offset: (page - 1) * limit,
  });

  return { runs: paginatedRuns, total };
}

// Delete run (soft delete)
export async function deleteRun(
  userId: string,
  runId: string
): Promise<void> {
  const run = await getRunById(userId, runId);
  if (!run) {
    return;
  }

  await db
    .update(runs)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(runs.id, runId));
}
