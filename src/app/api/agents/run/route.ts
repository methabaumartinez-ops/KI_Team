// =============================================================================
// AgentIA-Automate — POST /api/agents/run
// =============================================================================
// Accepts a { taskId } payload, delegates to the agent runner, and returns
// a structured response. Protected by middleware (requires auth).
// =============================================================================

import { NextResponse, type NextRequest } from "next/server";
import { executeTask } from "@/lib/antigravity/agent-runner";
import type { AgentRunRequest, AgentRunResponse } from "@/types";

export async function POST(request: NextRequest) {
  // --- Parse body ---
  let body: AgentRunRequest;
  try {
    body = (await request.json()) as AgentRunRequest;
  } catch {
    return NextResponse.json<AgentRunResponse>(
      { success: false, executionId: null, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  // --- Validate required fields ---
  if (!body.taskId || typeof body.taskId !== "string") {
    return NextResponse.json<AgentRunResponse>(
      { success: false, executionId: null, error: "taskId is required" },
      { status: 400 }
    );
  }

  // --- Execute task ---
  const result = await executeTask(body.taskId);

  const statusCode = result.success ? 200 : 500;

  return NextResponse.json<AgentRunResponse>(
    {
      success: result.success,
      executionId: result.executionId,
      error: result.error,
    },
    { status: statusCode }
  );
}
