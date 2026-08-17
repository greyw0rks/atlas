import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/memory/retrieval";

export const dynamic = "force-dynamic";

/**
 * GET /api/sessions/[id]
 * Get full session details including memories and decisions
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;
    const session = await getSession(sessionId);

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error(`[GET /api/sessions/${params.id}] error:`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch session" },
      { status: 500 }
    );
  }
}
