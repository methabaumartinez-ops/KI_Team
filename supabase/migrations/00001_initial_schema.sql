-- =============================================================================
-- AgentIA-Automate — Initial Migration
-- Creates core domain tables: agents, projects, tasks, executions,
-- knowledge_documents.
-- RLS is enabled on all tables.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Agents (read-only dictionary of available AI agents)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  capability  TEXT NOT NULL,
  system_prompt TEXT NOT NULL DEFAULT '',
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

-- Agents are readable by all authenticated users
CREATE POLICY "agents_select_authenticated"
  ON public.agents FOR SELECT
  TO authenticated
  USING (true);

-- ---------------------------------------------------------------------------
-- 2. Projects (grouping container for work)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  owner_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Users can only see their own projects
CREATE POLICY "projects_select_own"
  ON public.projects FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "projects_insert_own"
  ON public.projects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "projects_update_own"
  ON public.projects FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "projects_delete_own"
  ON public.projects FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- ---------------------------------------------------------------------------
-- 3. Tasks (work orders dispatched to agents)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tasks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  agent_id      UUID NOT NULL REFERENCES public.agents(id) ON DELETE RESTRICT,
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  input_payload JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Tasks are visible through project ownership
CREATE POLICY "tasks_select_via_project"
  ON public.tasks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = tasks.project_id
        AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "tasks_insert_via_project"
  ON public.tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = tasks.project_id
        AND projects.owner_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 4. Executions (granular logs of agent runs)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.executions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  output_text TEXT NOT NULL DEFAULT '',
  duration_ms INTEGER NOT NULL DEFAULT 0,
  tokens_used INTEGER NOT NULL DEFAULT 0,
  model_used  TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.executions ENABLE ROW LEVEL SECURITY;

-- Executions are visible through task → project ownership
CREATE POLICY "executions_select_via_task"
  ON public.executions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks
      JOIN public.projects ON projects.id = tasks.project_id
      WHERE tasks.id = executions.task_id
        AND projects.owner_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 5. Knowledge Documents (metadata for RAG-indexed content)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.knowledge_documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  source_url      TEXT,
  qdrant_point_id TEXT,
  chunk_count     INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.knowledge_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "knowledge_docs_select_via_project"
  ON public.knowledge_documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = knowledge_documents.project_id
        AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "knowledge_docs_insert_via_project"
  ON public.knowledge_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = knowledge_documents.project_id
        AND projects.owner_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 6. Seed data: Core agent definitions
-- ---------------------------------------------------------------------------
INSERT INTO public.agents (name, slug, description, capability, system_prompt)
VALUES
  (
    'Web App Developer',
    'web-app-developer',
    'Specialized in building modern web applications with Next.js, React, and TailwindCSS.',
    'web_development',
    'You are a senior web application developer specializing in Next.js, React 19, and TailwindCSS 4. You write clean, type-safe TypeScript code following SOLID principles.'
  ),
  (
    'Mobile App Developer',
    'mobile-app-developer',
    'Specialized in cross-platform mobile development.',
    'mobile_development',
    'You are a senior mobile application developer. You build performant, accessible mobile apps with clean architecture.'
  ),
  (
    'Antigravity Prompt Engineer',
    'prompt-engineer',
    'Expert in crafting precise, effective prompts for AI systems.',
    'prompt_engineering',
    'You are an expert prompt engineer. You design structured, effective prompts that maximize AI output quality while minimizing token usage.'
  ),
  (
    'Database Architect',
    'database-architect',
    'Supabase expert for relational schema design, RLS policies, and migrations.',
    'database_architecture',
    'You are a database architect specializing in PostgreSQL and Supabase. You design normalized schemas with proper RLS policies and efficient indexes.'
  ),
  (
    'RAG & Vector Search Specialist',
    'rag-specialist',
    'Expert in Qdrant, embeddings, and retrieval-augmented generation pipelines.',
    'rag_vector_search',
    'You are a RAG specialist. You design embedding pipelines, vector search strategies, and retrieval-augmented generation flows using Qdrant.'
  ),
  (
    'DevOps & Infrastructure Engineer',
    'devops-engineer',
    'Handles deployment, CI/CD, containerization, and VPS infrastructure.',
    'devops_infrastructure',
    'You are a DevOps engineer specializing in VPS deployment, Docker, CI/CD pipelines, and infrastructure automation.'
  )
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 7. Indexes for performance
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_agent_id ON public.tasks(agent_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_executions_task_id ON public.executions(task_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_docs_project_id ON public.knowledge_documents(project_id);

-- ---------------------------------------------------------------------------
-- 8. Updated_at trigger function
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_agents_updated_at
  BEFORE UPDATE ON public.agents
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_knowledge_docs_updated_at
  BEFORE UPDATE ON public.knowledge_documents
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
