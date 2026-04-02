import { getQdrantClient, COLLECTION_NAME } from "./client";
import { generateEmbedding } from "@/lib/ai/provider";

export async function searchVectorDatabase(query: string, limit: number = 3): Promise<string[]> {
  try {
    const client = getQdrantClient();
    
    // Convert the user's natural language query into a math vector via Gemini
    const vector = await generateEmbedding(query);
    
    // Search the Qdrant database for the closest semantic matches
    const searchResults = await client.search(COLLECTION_NAME, {
      vector: vector,
      limit: limit,
      with_payload: true,
    });
    
    // Extract the raw text chunks from the results
    return searchResults.map((result) => {
      const payload = result.payload as any;
      return payload?.text ? `[Documento: ${payload.filename || 'Desconocido'}]\n${payload.text}` : "";
    }).filter(text => text.length > 0);
  } catch (error) {
    console.error("Vector search failed:", error);
    return [];
  }
}
