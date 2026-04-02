// =============================================================================
// AgentIA-Automate — Database Types (Supabase Schema Mapping)
// =============================================================================
// Hand-written typed schema that maps directly to the Supabase tables.
// In production, this can be auto-generated via `supabase gen types typescript`.
// Kept manual here to avoid requiring the Supabase CLI as a hard dependency.
// =============================================================================

export interface Database {
  public: {
    Tables: {
      agents: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string;
          capability: string;
          system_prompt: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string;
          capability: string;
          system_prompt?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string;
          capability?: string;
          system_prompt?: string;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          name: string;
          description: string;
          owner_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          owner_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          updated_at?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          project_id: string;
          agent_id: string;
          status: "pending" | "running" | "completed" | "failed";
          input_payload: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          agent_id: string;
          status?: "pending" | "running" | "completed" | "failed";
          input_payload?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          status?: "pending" | "running" | "completed" | "failed";
          input_payload?: Record<string, unknown>;
          updated_at?: string;
        };
      };
      executions: {
        Row: {
          id: string;
          task_id: string;
          output_text: string;
          duration_ms: number;
          tokens_used: number;
          model_used: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          output_text?: string;
          duration_ms?: number;
          tokens_used?: number;
          model_used?: string;
          created_at?: string;
        };
        Update: {
          output_text?: string;
          duration_ms?: number;
          tokens_used?: number;
          model_used?: string;
        };
      };
      knowledge_documents: {
        Row: {
          id: string;
          project_id: string;
          title: string;
          source_url: string | null;
          qdrant_point_id: string | null;
          chunk_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          title: string;
          source_url?: string | null;
          qdrant_point_id?: string | null;
          chunk_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          source_url?: string | null;
          qdrant_point_id?: string | null;
          chunk_count?: number;
          updated_at?: string;
        };
      };
    };
  };
}
