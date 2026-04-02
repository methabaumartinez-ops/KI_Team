"use client";

// =============================================================================
// AgentIA-Automate — Orchestrator Viewport (Feature Component)
// =============================================================================
// Assembles the full orchestrator view:
//   - BrainCore (shell) with embedded chat + InputBar + RefinementBadge
//   - Radial AgentNodes (desktop) / horizontal ribbon (mobile)
//   - Logo fixed bottom-left
// Manages local UI state only. No direct API calls.
// =============================================================================

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { BrainCore } from "@/components/ui/brain-core";
import { AgentNode, type AgentNodeStatus } from "@/components/ui/agent-node";
import { InputBar } from "@/components/ui/input-bar";
import { RefinementBadge } from "@/components/ui/refinement-badge";
import { Logo } from "@/components/ui/logo";
import { AGENT_DEFINITIONS, type AgentDefinition } from "@/lib/antigravity/agent-registry";
import { AgentConfigModal } from "./agent-config-modal";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChatMessage {
  id: string;
  role: "user" | "orchestrator" | "agent" | "refined";
  content: string;
  agentSlug?: string;
  timestamp: Date;
}

type OrchestratorPhase = "idle" | "dispatching" | "receiving" | "refining" | "done";

// ---------------------------------------------------------------------------
// Simulated demo flow (placeholder until backend is wired)
// ---------------------------------------------------------------------------

const DEMO_RESPONSES: Record<string, string> = {
  default:
    "Anfrag empfange. Ich koordiniere d'Agente und bring dir d'Antwort.",
  refining:
    "✦ Antigravity Refinement: D'Antwort wurde strukturiert, präzisiert und optimiert für maximali Klarheit.",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function OrchestratorViewport() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "0",
      role: "orchestrator",
      content:
        "Hola Fran, vienes con algo nuevo? en que quieres trabajar hoy?",
      timestamp: new Date(),
    },
  ]);
  const [agentStatuses, setAgentStatuses] = useState<
    Record<string, AgentNodeStatus>
  >({});
  const [phase, setPhase] = useState<OrchestratorPhase>("idle");
  const [isRefinementVisible, setIsRefinementVisible] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Track conversational session for multi-turn DB memory
  const [clientSessionId, setClientSessionId] = useState<string | null>(null);

  // Custom GPT Configuration State
  const [selectedConfigAgent, setSelectedConfigAgent] = useState<AgentDefinition | null>(null);
  const [dbPrompts, setDbPrompts] = useState<Record<string, string>>({});

  useEffect(() => {
    // Load custom prompts from database on mount
    fetch("/api/agents")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          const map: Record<string, string> = {};
          data.data.forEach((ag: any) => { map[ag.slug] = ag.system_prompt; });
          setDbPrompts(map);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, phase]);

  const handleSaveAgentConfig = async (slug: string, newPrompt: string) => {
    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, system_prompt: newPrompt })
      });
      if (res.ok) {
        setDbPrompts((prev) => ({ ...prev, [slug]: newPrompt }));
        addMessage({ role: "orchestrator", content: `Personalidad de [${slug}] actualizada correctamente.` });
      }
    } catch (e) {
      console.error(e);
      addMessage({ role: "orchestrator", content: `Error al guardar personalidad de [${slug}].` });
    }
  };

  const addMessage = (msg: Omit<ChatMessage, "id" | "timestamp">) => {
    setMessages((prev) => [
      ...prev,
      { ...msg, id: Date.now().toString(), timestamp: new Date() },
    ]);
  };

  // Streaming orchestration flow via SSE
  const handleSend = async (content: string) => {
    if (phase !== "idle") return;

    addMessage({ role: "user", content });
    setPhase("dispatching");

    try {
      const response = await fetch("/api/orchestrator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Pass the session memory token
        body: JSON.stringify({ prompt: content, sessionId: clientSessionId }),
      });

      if (!response.ok) throw new Error("Orchestration failed");
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No readable stream");

      const decoder = new TextDecoder();
      let buffer = "";
      let refinedMessageId: string | null = null;
      let refinedText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const blocks = buffer.split("\n\n");
        buffer = blocks.pop() || "";

        for (const block of blocks) {
          const match = block.match(/event:\s*(.*?)\ndata:\s*(.*)/);
          if (match) {
            const event = match[1];
            const dataStr = match[2];
            const data = dataStr && dataStr !== "undefined" ? JSON.parse(dataStr) : {};

            if (event === "sessionId" && data.sessionId) {
               setClientSessionId(data.sessionId);
            } else if (event === "status") {
              if (data.phase) setPhase(data.phase);
              if (data.agentStatuses) {
                setAgentStatuses((prev) => ({ ...prev, ...data.agentStatuses }));
              }
            } else if (event === "text") {
              refinedText += data.chunk;
              if (!refinedMessageId) {
                refinedMessageId = Date.now().toString();
                setMessages((prev) => [
                  ...prev,
                  {
                    id: refinedMessageId!,
                    role: "refined",
                    content: refinedText,
                    timestamp: new Date(),
                  },
                ]);
              } else {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === refinedMessageId ? { ...m, content: refinedText } : m
                  )
                );
              }
            } else if (event === "error") {
              addMessage({ role: "orchestrator", content: "🚨 Error crítico del sistema: " + (data.message || 'Fallo desconocido') });
              setPhase("idle");
              setAgentStatuses({});
            } else if (event === "done") {
              await delay(1000);
              setPhase("idle");
              setAgentStatuses({});
            }
          }
        }
      }
    } catch (error) {
      console.error(error);
      setPhase("idle");
      setAgentStatuses({});
    }
  };

  const handleFileUpload = async (file: File) => {
    if (phase !== "idle") return;
    
    addMessage({ role: "user", content: `Upload: ${file.name}` });
    setPhase("dispatching");
    addMessage({ role: "orchestrator", content: `Verarbeite "${file.name}"...` });

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/documents/ingest", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (res.ok && data.success) {
        addMessage({ 
          role: "orchestrator", 
          content: `Dokument erfolgreich in die Wissensdatenbank integriert (${data.chunksProcessed} Chunks verarbeitet).` 
        });
      } else {
        addMessage({ role: "orchestrator", content: `Fehler beim Hochladen: ${data.message}` });
      }
    } catch (error) {
      console.error("Upload error:", error);
      addMessage({ role: "orchestrator", content: "Es ist ein Fehler aufgetreten beim Hochladen." });
    } finally {
      setPhase("idle");
    }
  };

  const isReceiving = phase === "receiving" || phase === "refining";

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-end pb-12 overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none bg-[#020202]">
        {/* Removed confusing static background logo overlay */}
        {/* Subtle radial glow at center */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 50% 50% at 50% 50%, rgba(212,160,23,0.06) 0%, transparent 100%)",
          }}
        />
      </div>
      {/* ------------------------------------------------------------------ */}
      {/* Central Hub wrapper (holds both Core and Constellation)            */}
      {/* ------------------------------------------------------------------ */}
      <div className="relative z-10 w-full flex justify-center">
        {/* Desktop: neural agent constellation */}
        <div className="hidden lg:block absolute pointer-events-none" style={{ top: "35%", left: "50%" }}>
          <div className="absolute" style={{ transform: "translate(-50%, -50%)" }}>
            {AGENT_DEFINITIONS.map((agent, index) => (
              <div key={agent.slug} className="pointer-events-auto">
                <AgentNode
                  agent={agent}
                  index={index}
                  total={AGENT_DEFINITIONS.length}
                  status={agentStatuses[agent.slug] ?? "idle"}
                  isRefinementAgent={agent.slug === "prompt-engineer"}
                  onConfigure={() => setSelectedConfigAgent(agent)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* BrainCore Terminal */}
        <BrainCore isReceiving={isReceiving}>
          {/* Chat messages */}
          <div
            className="flex-1 overflow-y-auto flex flex-col"
            style={{ padding: "var(--space-md)", gap: "var(--space-sm)" }}
          >
            {messages.map((msg) => (
              <ChatBubble key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </div>

          <RefinementBadge isActive={phase === "refining"} />

          {/* ... Input ... */}
          <InputBar
            onSend={handleSend}
            disabled={phase !== "idle"}
            onFileUpload={handleFileUpload}
            onImageUpload={() => {}}
            onVoiceStart={() => {}}
            onDeepThink={() => {}}
          />
        </BrainCore>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Mobile: horizontal agent ribbon below the core                      */}
      {/* ------------------------------------------------------------------ */}
      <div
        className="lg:hidden absolute bottom-0 left-0 right-0 flex items-center overflow-x-auto"
        style={{
          padding: "var(--space-sm)",
          gap: "var(--space-md)",
          background: "var(--color-surface-primary)",
          borderTop: "1px solid var(--color-border-default)",
          paddingBottom: "max(var(--space-sm), env(safe-area-inset-bottom))",
        }}
      >
        {AGENT_DEFINITIONS.map((agent) => (
          <MobileAgentPill
            key={agent.slug}
            agent={{ name: agent.name, icon: agent.icon, slug: agent.slug }}
            status={agentStatuses[agent.slug] ?? "idle"}
            isRefinement={agent.slug === "prompt-engineer"}
          />
        ))}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Logo — fixed bottom-left (all screens)                             */}
      {/* ------------------------------------------------------------------ */}
      <div
        className="fixed bottom-0 left-0 z-20 flex"
        style={{ padding: "var(--space-md) var(--space-lg)" }}
      >
        <Logo size="sm" />
      </div>

      <AgentConfigModal
        isOpen={!!selectedConfigAgent}
        agent={selectedConfigAgent}
        currentPrompt={selectedConfigAgent ? dbPrompts[selectedConfigAgent.slug] || null : null}
        onClose={() => setSelectedConfigAgent(null)}
        onSave={handleSaveAgentConfig}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chat Bubble (internal)
// ---------------------------------------------------------------------------

const ROLE_STYLES: Record<
  ChatMessage["role"],
  { align: string; bg: string; border: string; color: string; label: string }
> = {
  user: {
    align: "items-end",
    bg: "var(--color-surface-elevated)",
    border: "var(--color-border-default)",
    color: "var(--color-text-primary)",
    label: "Du",
  },
  orchestrator: {
    align: "items-start",
    bg: "var(--color-accent-subtle)",
    border: "var(--color-gold-800)",
    color: "var(--color-text-primary)",
    label: "Asistente de desarrollo",
  },
  agent: {
    align: "items-start",
    bg: "var(--color-surface-elevated)",
    border: "var(--color-border-default)",
    color: "var(--color-text-secondary)",
    label: "Agent",
  },
  refined: {
    align: "items-start",
    bg: "var(--color-accent-subtle)",
    border: "var(--color-gold-600)",
    color: "var(--color-text-primary)",
    label: "✦ Verfeinerig",
  },
};

function ChatBubble({ message }: { message: ChatMessage }) {
  const style = ROLE_STYLES[message.role];

  return (
    <div className={`flex flex-col ${style.align}`}>
      <span
        className="text-[9px] font-semibold uppercase tracking-wider mb-0.5"
        style={{ color: "var(--color-text-muted)" }}
      >
        {style.label}
      </span>
      <div
        className="text-xs leading-relaxed max-w-[90%]"
        style={{
          padding: "var(--space-sm) var(--space-md)",
          background: style.bg,
          border: `1px solid ${style.border}`,
          borderRadius: "var(--radius-lg)",
          color: style.color,
        }}
      >
        {message.content}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mobile Agent Pill (internal)
// ---------------------------------------------------------------------------

const MOBILE_ICONS: Record<string, string> = {
  globe: "🌐",
  smartphone: "📱",
  sparkles: "✦",
  database: "🗄",
  search: "🔍",
  server: "🖥",
};

function MobileAgentPill({
  agent,
  status,
  isRefinement,
}: {
  agent: { name: string; icon: string; slug: string };
  status: AgentNodeStatus;
  isRefinement: boolean;
}) {
  return (
    <div
      className="flex flex-col items-center shrink-0"
      style={{ gap: "2px" }}
    >
      <div
        className={`flex items-center justify-center text-sm ${
          status === "working" ? "animate-node-working" : ""
        }`}
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "var(--radius-full)",
          background: "var(--color-surface-elevated)",
          border: `1px solid ${
            status === "idle"
              ? "var(--color-gold-900)"
              : status === "working"
              ? "var(--color-gold-500)"
              : "var(--color-gold-700)"
          }`,
        }}
      >
        {MOBILE_ICONS[agent.icon] || "✦"}
      </div>
      <span
        className="text-[8px] text-center"
        style={{
          color: isRefinement
            ? "var(--color-text-accent)"
            : "var(--color-text-muted)",
          maxWidth: "48px",
          lineHeight: "1.2",
        }}
      >
        {agent.name.split(" ")[0]}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
