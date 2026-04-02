// =============================================================================
// AgentIA-Automate — AI Provider Wrapper
// =============================================================================
// Single point of dependency for the AI SDK.
// Wraps @ai-sdk/google so the rest of the app never imports it directly.
// If we swap Google for Anthropic/Groq/local models, only this file changes.
// =============================================================================

import { google } from "@ai-sdk/google";
import { embed, generateText } from "ai";

// ---------------------------------------------------------------------------
// Model Configuration
// ---------------------------------------------------------------------------

const DEFAULT_CHAT_MODEL = "gemini-2.5-flash";
const DEFAULT_EMBEDDING_MODEL = "text-embedding-004";

export const getActiveModel = (modelId?: string) => google(modelId || DEFAULT_CHAT_MODEL);

// ---------------------------------------------------------------------------
// Text Generation
// ---------------------------------------------------------------------------

export interface GenerateOptions {
  systemPrompt: string;
  userPrompt: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface GenerateResult {
  text: string;
  tokensUsed: number;
  modelUsed: string;
  durationMs: number;
}

/**
 * Generates text using the configured AI provider.
 * Returns structured output with usage metrics for logging.
 */
export async function generateAgentResponse(
  options: GenerateOptions
): Promise<GenerateResult> {
  const modelId = options.model || DEFAULT_CHAT_MODEL;
  const startTime = Date.now();

  const result = await generateText({
    model: getActiveModel(modelId),
    system: options.systemPrompt,
    prompt: options.userPrompt,
    maxOutputTokens: options.maxTokens ?? 2048,
    temperature: options.temperature ?? 0.7,
  });

  const durationMs = Date.now() - startTime;

  return {
    text: result.text,
    tokensUsed: result.usage?.totalTokens ?? 0,
    modelUsed: modelId,
    durationMs,
  };
}

// ---------------------------------------------------------------------------
// Embeddings
// ---------------------------------------------------------------------------

/**
 * Generates an embedding vector for the given text.
 * Uses the configured embedding model (default: text-embedding-004).
 */
export async function generateEmbedding(
  text: string,
  model?: string
): Promise<number[]> {
  const result = await embed({
    model: google.textEmbeddingModel(model || DEFAULT_EMBEDDING_MODEL),
    value: text,
  });

  return result.embedding;
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export { DEFAULT_CHAT_MODEL, DEFAULT_EMBEDDING_MODEL };
