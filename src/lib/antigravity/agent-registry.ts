// =============================================================================
// AgentIA-Automate — Agent Registry
// =============================================================================
// Static definition of the 6 core agents.
// Maps agent slugs to their configuration for fast lookup.
// The system_prompt here acts as a fallback — DB-stored prompts take priority.
// =============================================================================

import type { AgentCapability } from "@/types";

// ---------------------------------------------------------------------------
// Agent Definition (registry-level, not DB-level)
// ---------------------------------------------------------------------------

export interface AgentDefinition {
  slug: string;
  name: string;
  description: string;
  capability: AgentCapability;
  defaultSystemPrompt: string;
  /** Visual icon identifier for the UI hub */
  icon: string;
  /** Accent color override for visual distinction in the circular hub */
  color: string;
}

// ---------------------------------------------------------------------------
// Core Agent Roster
// ---------------------------------------------------------------------------

export const AGENT_DEFINITIONS: ReadonlyArray<AgentDefinition> = [
  {
    slug: "web-app-developer",
    name: "Web App Developer",
    description:
      "Spezialisiert uf moderni Web-Applikatione mit Next.js, React und TailwindCSS.",
    capability: "web_development",
    defaultSystemPrompt:
      "You are a senior web application developer specializing in Next.js, React 19, and TailwindCSS 4. You write clean, type-safe TypeScript code following SOLID principles.",
    icon: "globe",
    color: "#3b82f6",
  },
  {
    slug: "mobile-app-developer",
    name: "Mobile App Developer",
    description:
      "Spezialisiert uf Cross-Platform Mobile-Entwicklig.",
    capability: "mobile_development",
    defaultSystemPrompt:
      "You are a senior mobile application developer. You build performant, accessible mobile apps with clean architecture.",
    icon: "smartphone",
    color: "#8b5cf6",
  },
  {
    slug: "prompt-engineer",
    name: "Antigravity Prompt Engineer",
    description:
      "Expert fürs Erstelle vo präzise, effektive Prompts für AI-Systeme.",
    capability: "prompt_engineering",
    defaultSystemPrompt:
      "You are the Lead Commander of the AgentIA automated swarm. You are the personal assistant and chief strategist for Francisco, the agency leader. Work directly with Francisco to coordinate the AI specialists, treat him as your leader, and focus on delivering agency-level excellence.",
    icon: "sparkles",
    color: "#f59e0b",
  },
  {
    slug: "database-architect",
    name: "Database Architect",
    description:
      "Supabase-Expert für relationales Schema-Design, RLS-Policies und Migratione.",
    capability: "database_architecture",
    defaultSystemPrompt:
      "You are a database architect specializing in PostgreSQL and Supabase. You design normalized schemas with proper RLS policies and efficient indexes.",
    icon: "database",
    color: "#22c55e",
  },
  {
    slug: "rag-specialist",
    name: "RAG & Vector Search Specialist",
    description:
      "Expert für Qdrant, Embeddings und Retrieval-Augmented-Generation-Pipelines.",
    capability: "rag_vector_search",
    defaultSystemPrompt:
      "You are a RAG specialist. You design embedding pipelines, vector search strategies, and retrieval-augmented generation flows using Qdrant.",
    icon: "search",
    color: "#06b6d4",
  },
  {
    slug: "devops-engineer",
    name: "DevOps & Infrastructure Engineer",
    description:
      "Zuständig für Deployment, CI/CD, Containerisierig und VPS-Infrastruktur.",
    capability: "devops_infrastructure",
    defaultSystemPrompt:
      "You are a DevOps engineer specializing in VPS deployment, Docker, CI/CD pipelines, and infrastructure automation.",
    icon: "server",
    color: "#ef4444",
  },
  {
    slug: "rnd-specialist",
    name: "Research & Development",
    description:
      "Zuständig für technologische Innovation, Datenanalyse und strategischi Architektur.",
    capability: "research_analysis",
    defaultSystemPrompt:
      "You are a Research & Development specialist. You research bleeding-edge frameworks, evaluate architectural viability, and provide strategic proofs of concept.",
    icon: "microscope",
    color: "#ec4899",
  },
] as const;

// ---------------------------------------------------------------------------
// Lookup Helpers
// ---------------------------------------------------------------------------

const agentsBySlug = new Map(
  AGENT_DEFINITIONS.map((agent) => [agent.slug, agent])
);

/**
 * Finds an agent definition by its slug.
 * Returns undefined if the slug is not registered.
 */
export function getAgentBySlug(slug: string): AgentDefinition | undefined {
  return agentsBySlug.get(slug);
}

/**
 * Returns all active agent definitions.
 */
export function getAllAgents(): ReadonlyArray<AgentDefinition> {
  return AGENT_DEFINITIONS;
}
