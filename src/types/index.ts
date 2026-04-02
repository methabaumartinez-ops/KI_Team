// =============================================================================
// AgentIA-Automate — Domain Model Types
// =============================================================================
// These types define the application's domain entities.
// They are UI-agnostic and infrastructure-agnostic.
// Database-specific types live in database.types.ts.
// =============================================================================

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export type TaskStatus = "pending" | "running" | "completed" | "failed";

export type UserRole = "admin" | "user";

export type AgentCapability =
  | "web_development"
  | "mobile_development"
  | "prompt_engineering"
  | "database_architecture"
  | "rag_vector_search"
  | "devops_infrastructure"
  | "research_analysis";

// ---------------------------------------------------------------------------
// Core Domain Entities
// ---------------------------------------------------------------------------

export interface Agent {
  id: string;
  name: string;
  slug: string;
  description: string;
  capability: AgentCapability;
  systemPrompt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  agentId: string;
  status: TaskStatus;
  inputPayload: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Execution {
  id: string;
  taskId: string;
  outputText: string;
  durationMs: number;
  tokensUsed: number;
  modelUsed: string;
  createdAt: string;
}

export interface KnowledgeDocument {
  id: string;
  projectId: string;
  title: string;
  sourceUrl: string | null;
  qdrantPointId: string | null;
  chunkCount: number;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// API Contracts
// ---------------------------------------------------------------------------

export interface AgentRunRequest {
  taskId: string;
}

export interface AgentRunResponse {
  success: boolean;
  executionId: string | null;
  error: string | null;
}

// ---------------------------------------------------------------------------
// Utility Types
// ---------------------------------------------------------------------------

/** Generic API response wrapper to enforce uniform error handling. */
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}
