import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/middleware/auth";
import { getOrCreateUser } from "@/modules/auth";
import { getContributionYear } from "@/modules/contributions";
import { contributionQuerySchema } from "@/schemas";
import { handleApiError, validationError } from "@/lib/errors";
import { createRequestLogger } from "@/lib/logging";

// GET /api/v1/contributions - Get contribution graph data
export async function GET(req: NextRequest) {
  const requestId = req.headers.get("X-Request-ID") || "unknown";
  const logger = createRequestLogger(requestId);

  try {
    // Verify Auth0 token
    const authUser = await requireAuth(req);
    const user = await getOrCreateUser(authUser);

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const query = Object.fromEntries(searchParams);
    const validationResult = contributionQuerySchema.safeParse(query);

    if (!validationResult.success) {
      throw validationError(validationResult.error.errors[0].message);
    }

    const { year } = validationResult.data;

    // Get contribution data
    const contributions = await getContributionYear(user.id, year);

    logger.info({ userId: user.id, year, dayCount: contributions.days.length }, "Contributions fetched");

    return NextResponse.json({
      data: contributions,
    });
  } catch (error) {
    logger.error({ error }, "Failed to fetch contributions");
    return handleApiError(error, requestId);
  }
}
