import { db } from "@/db";
import { runs, runPausePeriods, type Run } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import {
  invalidRunStateError,
  runNotFoundError,
  duplicateClientRunError,
} from "@/lib/errors";
import { logRunEvent } from "@/lib/logging";

// Valid state transitions
const VALID_TRANSITIONS: Record<string, string[]> = {
  recording: ["paused", "discarded"],
  paused: ["recording", "discarded"],
  completed: [],
  discarded: [],
};

// Check if state transition is valid
function validateTransition(currentStatus: string, newStatus: string): void {
  const validNextStates = VALID_TRANSITIONS[currentStatus];
  if (!validNextStates?.includes(newStatus)) {
    throw invalidRunStateError(
      `Cannot transition from ${currentStatus} to ${newStatus}`
    );
  }
}

// Start a new run
export async function startRun(
  userId: string,
  clientRunId: string,
  startedAt?: Date,
  timezone?: string,
  title?: string
): Promise<Run> {
  // Check for existing run with same clientRunId (idempotency)
  const existingRun = await db.query.runs.findFirst({
    where: and(
      eq(runs.userId, userId),
      eq(runs.clientRunId, clientRunId)
    ),
  });

  if (existingRun) {
    // Return existing run if already completed or discarded
    if (existingRun.status === "completed" || existingRun.status === "discarded") {
      return existingRun;
    }
    // If still recording or paused, return it (idempotent)
    return existingRun;
  }

  // Check for any active run
  const activeRun = await db.query.runs.findFirst({
    where: and(
      eq(runs.userId, userId),
      eq(runs.status, "recording")
    ),
  });

  if (activeRun) {
    throw invalidRunStateError("User already has an active run");
  }

  // Create new run
  const runId = `run_${nanoid()}`;
  const runData = {
    id: runId,
    userId,
    clientRunId,
    status: "recording" as const,
    startedAt: startedAt || new Date(),
    timezone: timezone || "UTC",
    title: title || "Running Activity",
  };

  await db.insert(runs).values(runData);

  logRunEvent("run_started", {
    runId,
    userId,
    clientRunId,
  });

  // Return the created run
  const createdRun = await db.query.runs.findFirst({
    where: eq(runs.id, runId),
  });

  if (!createdRun) {
    throw new Error("Failed to create run");
  }

  return createdRun;
}

// Pause a run
export async function pauseRun(
  userId: string,
  runId: string
): Promise<Run> {
  const run = await getRunById(userId, runId);
  if (!run) {
    throw runNotFoundError();
  }

  validateTransition(run.status, "paused");

  // Create pause period
  const pauseId = `pause_${nanoid()}`;
  await db.insert(runPausePeriods).values({
    id: pauseId,
    runId,
    startedAt: new Date(),
  });

  // Update run status
  await db
    .update(runs)
    .set({ status: "paused", updatedAt: new Date() })
    .where(eq(runs.id, runId));

  logRunEvent("run_paused", { runId, userId });

  const updatedRun = await db.query.runs.findFirst({
    where: eq(runs.id, runId),
  });

  return updatedRun!;
}

// Resume a run
export async function resumeRun(
  userId: string,
  runId: string
): Promise<Run> {
  const run = await getRunById(userId, runId);
  if (!run) {
    throw runNotFoundError();
  }

  validateTransition(run.status, "recording");

  // Find the last pause period and close it
  const lastPause = await db.query.runPausePeriods.findFirst({
    where: eq(runPausePeriods.runId, runId),
    orderBy: desc(runPausePeriods.startedAt),
  });

  if (lastPause && !lastPause.endedAt) {
    const now = new Date();
    const durationSeconds = Math.floor(
      (now.getTime() - lastPause.startedAt.getTime()) / 1000
    );

    await db
      .update(runPausePeriods)
      .set({ endedAt: now, durationSeconds })
      .where(eq(runPausePeriods.id, lastPause.id));
  }

  // Update run status
  await db
    .update(runs)
    .set({ status: "recording", updatedAt: new Date() })
    .where(eq(runs.id, runId));

  logRunEvent("run_resumed", { runId, userId });

  const updatedRun = await db.query.runs.findFirst({
    where: eq(runs.id, runId),
  });

  return updatedRun!;
}

// Finish a run
export async function finishRun(
  userId: string,
  runId: string,
  endedAt?: Date
): Promise<Run> {
  const run = await getRunById(userId, runId);
  if (!run) {
    throw runNotFoundError();
  }

  validateTransition(run.status, "completed");

  // Close any open pause period
  const lastPause = await db.query.runPausePeriods.findFirst({
    where: eq(runPausePeriods.runId, runId),
    orderBy: desc(runPausePeriods.startedAt),
  });

  if (lastPause && !lastPause.endedAt) {
    const now = new Date();
    const durationSeconds = Math.floor(
      (now.getTime() - lastPause.startedAt.getTime()) / 1000
    );

    await db
      .update(runPausePeriods)
      .set({ endedAt: now, durationSeconds })
      .where(eq(runPausePeriods.id, lastPause.id));
  }

  const finalEndedAt = endedAt || new Date();

  // Update run status
  await db
    .update(runs)
    .set({
      status: "completed",
      endedAt: finalEndedAt,
      updatedAt: new Date(),
    })
    .where(eq(runs.id, runId));

  logRunEvent("run_finished", { runId, userId });

  const updatedRun = await db.query.runs.findFirst({
    where: eq(runs.id, runId),
  });

  return updatedRun!;
}

// Discard a run
export async function discardRun(
  userId: string,
  runId: string
): Promise<Run> {
  const run = await getRunById(userId, runId);
  if (!run) {
    throw runNotFoundError();
  }

  validateTransition(run.status, "discarded");

  // Update run status
  await db
    .update(runs)
    .set({ status: "discarded", updatedAt: new Date() })
    .where(eq(runs.id, runId));

  logRunEvent("run_discarded", { runId, userId });

  const updatedRun = await db.query.runs.findFirst({
    where: eq(runs.id, runId),
  });

  return updatedRun!;
}

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
    status?: string;
    from?: Date;
    to?: Date;
    sort?: "asc" | "desc";
  } = {}
): Promise<{ runs: Run[]; total: number }> {
  const { page = 1, limit = 20, status, from, to, sort = "desc" } = options;

  const conditions = [eq(runs.userId, userId)];

  if (status) {
    conditions.push(eq(runs.status, status as any));
  }

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
    throw runNotFoundError();
  }

  await db
    .update(runs)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(runs.id, runId));
}
