// =============================================================================
// AgentIA-Automate — Multimodal Input Bar
// =============================================================================
// Central command input with 5 affordances:
//   text, file upload, image upload, voice input, deep thinking toggle
// Pure UI — emits callbacks, no business logic.
// =============================================================================

"use client";

import { useState, useRef } from "react";

interface InputBarProps {
  onSend: (content: string) => void;
  onFileUpload?: (file: File) => void;
  onImageUpload?: (file: File) => void;
  onVoiceStart?: () => void;
  onDeepThink?: () => void;
  disabled?: boolean;
}

export function InputBar({
  onSend,
  onFileUpload,
  onImageUpload,
  onVoiceStart,
  onDeepThink,
  disabled = false,
}: InputBarProps) {
  const [input, setInput] = useState("");
  const [deepThinkActive, setDeepThinkActive] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    handler?: (file: File) => void
  ) => {
    const file = e.target.files?.[0];
    if (file && handler) handler(file);
    e.target.value = "";
  };

  const toggleDeepThink = () => {
    setDeepThinkActive((prev) => !prev);
    onDeepThink?.();
  };

  return (
    <div
      className="shrink-0"
      style={{
        padding: "var(--space-sm) var(--space-md)",
        borderTop: "1px solid var(--color-border-default)",
        background: "var(--color-surface-primary)",
      }}
    >
      {/* Text input */}
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="dame algo que hacer! Me aburro!"
        disabled={disabled}
        rows={2}
        className="w-full text-sm resize-none outline-none"
        style={{
          padding: "var(--space-sm)",
          background: "var(--color-surface-elevated)",
          border: "1px solid var(--color-border-default)",
          borderRadius: "var(--radius-md)",
          color: "var(--color-text-primary)",
          opacity: disabled ? 0.5 : 1,
        }}
        id="orchestrator-input"
      />

      {/* Action toolbar */}
      <div
        className="flex items-center justify-between"
        style={{ marginTop: "var(--space-xs)" }}
      >
        <div className="flex items-center gap-1">
          {/* File upload */}
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            onChange={(e) => handleFileChange(e, onFileUpload)}
          />
          <ToolbarButton
            label="Datei hochladen"
            onClick={() => fileRef.current?.click()}
            disabled={disabled}
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
            <polyline points="14 2 14 8 20 8" />
          </ToolbarButton>

          {/* Image upload */}
          <input
            ref={imageRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileChange(e, onImageUpload)}
          />
          <ToolbarButton
            label="Bild hochladen"
            onClick={() => imageRef.current?.click()}
            disabled={disabled}
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </ToolbarButton>

          {/* Voice input */}
          <ToolbarButton
            label="Stimmeingabe"
            onClick={() => onVoiceStart?.()}
            disabled={disabled}
          >
            <path d="M12 1a4 4 0 0 0-4 4v7a4 4 0 0 0 8 0V5a4 4 0 0 0-4-4z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </ToolbarButton>

          {/* Deep Think toggle */}
          <ToolbarButton
            label="Tiefes Denken"
            onClick={toggleDeepThink}
            disabled={disabled}
            active={deepThinkActive}
          >
            <path d="M12 2a7 7 0 0 1 7 7c0 2.8-1.6 5.2-4 6.3V17a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-1.7C6.6 14.2 5 11.8 5 9a7 7 0 0 1 7-7z" />
            <line x1="9" y1="21" x2="15" y2="21" />
          </ToolbarButton>
        </div>

        {/* Send button */}
        <button
          onClick={handleSubmit}
          disabled={disabled || !input.trim()}
          className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
          style={{
            padding: "var(--space-xs) var(--space-md)",
            background:
              disabled || !input.trim()
                ? "var(--color-gold-900)"
                : "var(--color-accent)",
            color: "var(--color-surface-primary)",
            borderRadius: "var(--radius-md)",
            border: "none",
            opacity: disabled || !input.trim() ? 0.5 : 1,
            transition: "var(--transition-fast)",
          }}
          id="orchestrator-send"
        >
          Abschicken
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toolbar Button (internal sub-component)
// ---------------------------------------------------------------------------

function ToolbarButton({
  children,
  label,
  onClick,
  disabled = false,
  active = false,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      className="flex items-center justify-center cursor-pointer"
      style={{
        width: "28px",
        height: "28px",
        borderRadius: "var(--radius-sm)",
        background: active
          ? "var(--color-accent-subtle)"
          : "transparent",
        border: active
          ? "1px solid var(--color-gold-700)"
          : "1px solid transparent",
        opacity: disabled ? 0.3 : 0.6,
        transition: "var(--transition-fast)",
      }}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke={active ? "var(--color-gold-400)" : "var(--color-text-secondary)"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {children}
      </svg>
    </button>
  );
}
