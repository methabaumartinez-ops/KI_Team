// =============================================================================
// AgentIA-Automate — POST /api/documents/ingest
// =============================================================================
// RAG document ingestion endpoint.
// Accepts multipart/form-data with a file. Extracts text in-memory, chunks it,
// generates embeddings via the AI provider, and upserts straight to Qdrant.
// Bypasses Supabase Storage completely, per user requirements.
// =============================================================================

import { NextResponse, type NextRequest } from "next/server";
import { generateEmbedding } from "@/lib/ai/provider";
import { upsertPoints, ensureCollection } from "@/lib/qdrant/client";
export const runtime = "nodejs";

interface IngestResponse {
  success: boolean;
  message: string;
  chunksProcessed?: number;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    
    if (!file) {
      return NextResponse.json<IngestResponse>(
        { success: false, message: "No file provided" },
        { status: 400 }
      );
    }

    // --- 1. Extract text in-memory ---
    const text = await file.text();
    if (!text || text.trim().length === 0) {
      return NextResponse.json<IngestResponse>(
        { success: false, message: "File text is empty" },
        { status: 400 }
      );
    }

    // --- 2. Chunk text (Basic recursive character strategy) ---
    // Target ~400 tokens per chunk (approx 1600 characters)
    const chunks = chunkText(text, 1600, 200);
    
    // --- 3. Ensure Qdrant collection exists ---
    await ensureCollection();

    // --- 4. Embed and Upsert in batches ---
    const BATCH_SIZE = 5; // Very conservative batch size for edge functions
    let processed = 0;

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batchChunks = chunks.slice(i, i + BATCH_SIZE);
      
      const points = await Promise.all(
        batchChunks.map(async (chunk) => {
          const vector = await generateEmbedding(chunk);
          return {
            id: crypto.randomUUID(),
            vector,
            payload: {
              filename: file.name,
              text: chunk,
              ingestedAt: new Date().toISOString(),
            },
          };
        })
      );
      
      await upsertPoints(points);
      processed += points.length;
    }

    return NextResponse.json<IngestResponse>(
      { success: true, message: "Document ingested successfully", chunksProcessed: processed },
      { status: 200 }
    );

  } catch (error) {
    console.error("Ingest error:", error);
    return NextResponse.json<IngestResponse>(
      { success: false, message: `Failed to ingest document: ${error instanceof Error ? error.message + " (Causa: " + (error.cause || "Desconocida") + ")" : String(error)}` },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Simple text chunking by length with overlap.
 * In a production scenario, use a proven library like LangChain's RecursiveCharacterTextSplitter.
 */
function chunkText(text: string, chunkSize: number, overlap: number): string[] {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    chunks.push(text.slice(i, i + chunkSize));
    i += chunkSize - overlap;
  }
  return chunks;
}
