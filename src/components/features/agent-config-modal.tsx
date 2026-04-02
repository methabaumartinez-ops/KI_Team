import { useState, useEffect } from "react";
import type { AgentDefinition } from "@/lib/antigravity/agent-registry";

interface AgentConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: AgentDefinition | null;
  currentPrompt: string | null;
  onSave: (slug: string, newPrompt: string) => Promise<void>;
}

export function AgentConfigModal({ isOpen, onClose, agent, currentPrompt, onSave }: AgentConfigModalProps) {
  const [prompt, setPrompt] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && agent) {
      setPrompt(currentPrompt || agent.defaultSystemPrompt);
    }
  }, [isOpen, agent, currentPrompt]);

  if (!isOpen || !agent) return null;

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(agent.slug, prompt);
    setIsSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-[#0a0a0a] border border-[var(--color-gold-800)] rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-gold-900)]/30 bg-gradient-to-r from-[rgba(212,160,23,0.05)] to-transparent">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{agent.icon === "globe" ? "🌐" : agent.icon === "smartphone" ? "📱" : agent.icon === "database" ? "💾" : agent.icon === "terminal" ? "🖥️" : agent.icon === "server" ? "☁️" : agent.icon === "search" ? "🔍" : "🤖"}</span>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">{agent.name} <span className="text-xs text-[var(--color-gold-500)] ml-2 uppercase font-mono tracking-widest px-2 py-0.5 border border-[var(--color-gold-700)] rounded-full">Custom GPT</span></h2>
              <p className="text-xs text-gray-400 mt-0.5">{agent.description}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex-1 max-h-[60vh] overflow-y-auto">
          <label className="block text-sm font-medium text-[var(--color-gold-300)] mb-2 uppercase tracking-wide">
            Instrucciones Core (System Prompt)
          </label>
          <p className="text-xs text-gray-500 mb-4">
            Modifica la personalidad y el conjunto de reglas que gobiernan a este agente. Estas instrucciones sobrescribirán permanentemente su comportamiento en el orquestador.
          </p>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full h-64 bg-black/50 border border-[var(--color-gold-800)] rounded-lg p-4 text-sm font-mono text-gray-300 focus:outline-none focus:border-[var(--color-gold-500)] focus:ring-1 focus:ring-[var(--color-gold-500)] transition-all resize-y"
            placeholder="Introduce las instrucciones detalladas del agente aquí..."
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 bg-black/40 border-t border-[var(--color-gold-900)]/30 gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 text-sm font-bold text-black bg-gradient-to-r from-[var(--color-gold-500)] to-[var(--color-gold-400)] rounded-lg hover:from-[var(--color-gold-400)] hover:to-[var(--color-gold-300)] transition-all shadow-[0_0_15px_rgba(212,160,23,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving ? "Guardando..." : "Guardar Personalidad"}
          </button>
        </div>
      </div>
    </div>
  );
}
