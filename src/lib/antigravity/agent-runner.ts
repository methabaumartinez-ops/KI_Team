// =============================================================================
// AgentIA-Automate — Agent Runner (Core Execution Engine)
// =============================================================================
// Orchestrates the full task lifecycle:
//   1. Load task from DB
//   2. Validate agent exists
//   3. Mark task as "running"
//   4. Optionally retrieve RAG context from Qdrant
//   5. Call AI provider
//   6. Save execution result
//   7. Mark task as "completed" or "failed"
//
// Uses the admin Supabase client to bypass RLS for system-level writes.
// =============================================================================

import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { generateAgentResponse } from "@/lib/ai/provider";
import { searchSimilar, COLLECTION_NAME } from "@/lib/qdrant/client";
import { generateEmbedding } from "@/lib/ai/provider";
import { getQdrantClient } from "@/lib/qdrant/client";
import type { TaskStatus } from "@/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RunnerResult {
  success: boolean;
  executionId: string | null;
  error: string | null;
}

interface TaskRow {
  id: string;
  project_id: string;
  agent_id: string;
  status: TaskStatus;
  input_payload: Record<string, unknown>;
}

interface AgentRow {
  id: string;
  slug: string;
  system_prompt: string;
  is_active: boolean;
}

// ---------------------------------------------------------------------------
// Main Execution Function
// ---------------------------------------------------------------------------

/**
 * Executes a task end-to-end.
 * This is the single entry point the API route calls.
 */
export async function executeTask(taskId: string): Promise<RunnerResult> {
  const supabase = createSupabaseAdminClient();

  // --- 1. Load task ---
  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .single<TaskRow>();

  if (taskError || !task) {
    return { success: false, executionId: null, error: "Task not found" };
  }

  if (task.status !== "pending") {
    return {
      success: false,
      executionId: null,
      error: `Task is already in state: ${task.status}`,
    };
  }

  // --- 2. Load agent ---
  const { data: agent, error: agentError } = await supabase
    .from("agents")
    .select("*")
    .eq("id", task.agent_id)
    .single<AgentRow>();

  if (agentError || !agent) {
    return { success: false, executionId: null, error: "Agent not found" };
  }

  if (!agent.is_active) {
    return { success: false, executionId: null, error: "Agent is deactivated" };
  }

  // --- 3. Mark as running ---
  await updateTaskStatus(supabase, taskId, "running");

  try {
    // --- 4. RAG context (optional, best-effort) ---
    const ragContext = await retrieveRagContext(task.input_payload);

    // --- 5. Build prompt and call AI ---
    const userPrompt = buildUserPrompt(task.input_payload, ragContext);

    const result = await generateAgentResponse({
      systemPrompt: agent.system_prompt,
      userPrompt,
    });

    // --- 6. Save execution ---
    const { data: execution } = await supabase
      .from("executions")
      .insert({
        task_id: taskId,
        output_text: result.text,
        duration_ms: result.durationMs,
        tokens_used: result.tokensUsed,
        model_used: result.modelUsed,
      })
      .select("id")
      .single();

    // --- 7. Mark as completed ---
    await updateTaskStatus(supabase, taskId, "completed");

    return {
      success: true,
      executionId: execution?.id ?? null,
      error: null,
    };
  } catch (err) {
    // --- Failure path ---
    await updateTaskStatus(supabase, taskId, "failed");

    const message = err instanceof Error ? err.message : "Unknown execution error";
    return { success: false, executionId: null, error: message };
  }
}

// ---------------------------------------------------------------------------
// Internal Helpers
// ---------------------------------------------------------------------------

async function updateTaskStatus(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  taskId: string,
  status: TaskStatus
) {
  await supabase.from("tasks").update({ status }).eq("id", taskId);
}

/**
 * Attempts to retrieve relevant context from Qdrant.
 * Returns empty string if Qdrant is unavailable or no query is present.
 * This is a best-effort operation — agent execution should not fail if RAG is down.
 */
async function retrieveRagContext(
  payload: Record<string, unknown>
): Promise<string> {
  const query = (payload.query as string) || (payload.prompt as string) || "";

  if (!query) return "";

  try {
    // Check if Qdrant collection exists before querying
    const client = getQdrantClient();
    try {
      await client.getCollection(COLLECTION_NAME);
    } catch {
      // Collection doesn't exist yet — skip RAG
      return "";
    }

    const embedding = await generateEmbedding(query);
    const results = await searchSimilar(embedding, 3);

    if (!results.points || results.points.length === 0) return "";

    const contextChunks = results.points
      .map((point) => {
        const payload = point.payload as Record<string, unknown> | null;
        return payload?.text as string || "";
      })
      .filter(Boolean);

    if (contextChunks.length === 0) return "";

    return `\n\n--- Relevant Context ---\n${contextChunks.join("\n\n---\n\n")}\n--- End Context ---`;
  } catch {
    // RAG failure is non-fatal — the agent can still function without context
    return "";
  }
}

/**
 * Builds the user prompt from the task payload and optional RAG context.
 */
function buildUserPrompt(
  payload: Record<string, unknown>,
  ragContext: string
): string {
  const basePrompt =
    (payload.prompt as string) ||
    (payload.query as string) ||
    JSON.stringify(payload);

  return `${basePrompt}${ragContext}`;
}
