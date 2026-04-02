// =============================================================================
// AgentIA-Automate — Refinement Badge
// =============================================================================
// Visual indicator for the Antigravity Prompt Engineer final stage.
// Shows a gold shimmer animation during active refinement.
// Visually distinct from agent nodes — represents synthesis/polish.
// =============================================================================

interface RefinementBadgeProps {
  isActive?: boolean;
}

export function RefinementBadge({ isActive = true }: RefinementBadgeProps) {
  if (!isActive) return null;

  return (
    <div
      className="flex items-center justify-center gap-2 shrink-0"
      style={{
        padding: "var(--space-xs) var(--space-md)",
        background: "var(--color-accent-subtle)",
        borderTop: "1px solid var(--color-border-accent)",
      }}
    >
      {/* Sparkle icon */}
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="var(--color-gold-500)"
      >
        <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z" />
      </svg>

      <span
        className="text-[10px] font-semibold tracking-wider uppercase animate-gold-shimmer"
      >
        Antigravity Verfeinerung
      </span>

      {/* Pulsing dot */}
      <div
        className="animate-pulse-glow"
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "var(--radius-full)",
          background: "var(--color-gold-400)",
        }}
      />
    </div>
  );
}
