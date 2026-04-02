// =============================================================================
// AgentIA-Automate — Qdrant Client Wrapper
// =============================================================================
// Singleton wrapper for the Qdrant vector database client.
// Isolates the @qdrant/js-client-rest dependency behind a stable interface.
// If we swap Qdrant for another vector DB, only this file changes.
// =============================================================================

import { QdrantClient } from "@qdrant/js-client-rest";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const QDRANT_URL = process.env.QDRANT_URL || "http://localhost:6333";
const QDRANT_API_KEY = process.env.QDRANT_API_KEY;
const COLLECTION_NAME =
  process.env.QDRANT_COLLECTION_NAME || "agentia_docs_v2";

/**
 * Embedding dimension — must match the model used for vectorization.
 * Google gemini text-embedding-004 = 768 dimensions
 */
const EMBEDDING_DIMENSION = 768;

// ---------------------------------------------------------------------------
// Singleton instance
// ---------------------------------------------------------------------------

let clientInstance: QdrantClient | null = null;

/**
 * Returns a singleton Qdrant client instance.
 * Reuses connection across requests to avoid overhead.
 */
export function getQdrantClient(): QdrantClient {
  if (!clientInstance) {
    clientInstance = new QdrantClient({
      url: QDRANT_URL,
      apiKey: QDRANT_API_KEY || undefined,
    });
  }
  return clientInstance;
}

// ---------------------------------------------------------------------------
// Collection Management
// ---------------------------------------------------------------------------

/**
 * Ensures the target collection exists. Creates it if missing.
 * Idempotent — safe to call on every app startup.
 */
export async function ensureCollection(): Promise<void> {
  const client = getQdrantClient();

  try {
    await client.getCollection(COLLECTION_NAME);
  } catch {
    // Collection does not exist — create it
    await client.createCollection(COLLECTION_NAME, {
      vectors: {
        size: EMBEDDING_DIMENSION,
        distance: "Cosine",
      },
    });
  }
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

/**
 * Searches for similar vectors in the collection.
 * Returns the top `limit` results with payload data.
 */
export async function searchSimilar(
  vector: number[],
  limit: number = 5,
  filter?: Record<string, unknown>
) {
  const client = getQdrantClient();

  return client.query(COLLECTION_NAME, {
    query: vector,
    limit,
    filter: filter as never,
    with_payload: true,
  });
}

// ---------------------------------------------------------------------------
// Upsert
// ---------------------------------------------------------------------------

/**
 * Upserts points (document chunks) into the collection.
 */
export async function upsertPoints(
  points: Array<{
    id: string;
    vector: number[];
    payload: Record<string, unknown>;
  }>
) {
  const client = getQdrantClient();

  return client.upsert(COLLECTION_NAME, {
    wait: true,
    points,
  });
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export { COLLECTION_NAME, EMBEDDING_DIMENSION };
