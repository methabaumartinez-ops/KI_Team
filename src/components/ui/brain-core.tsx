// =============================================================================
// AgentIA-Automate — Brain Core (Orchestrator Shell with cerebro.jpg)
// =============================================================================
// The cerebro.jpg is used as the background visual of the brain container.
// The orchestrator chat overlays on top with a dark semi-transparent backdrop.
// On mobile: full-width card. On desktop: circular brain frame.
// =============================================================================

import Image from "next/image";

interface BrainCoreProps {
  children: React.ReactNode;
  isReceiving?: boolean;
}

export function BrainCore({ children, isReceiving = false }: BrainCoreProps) {
  return (
    <div className="relative flex items-center justify-center w-full lg:w-auto z-10">

      {/* --- Desktop: outer orbital ring --- */}
      <div
        className="hidden lg:block absolute animate-spin-slow pointer-events-none"
        style={{
          width: "660px",
          height: "660px",
          borderRadius: "var(--radius-full)",
          border: "1px solid var(--color-border-accent)",
          opacity: 0.15,
        }}
      />

      {/* --- Desktop: second ring --- */}
      <div
        className="hidden lg:block absolute pointer-events-none"
        style={{
          width: "600px",
          height: "600px",
          borderRadius: "var(--radius-full)",
          border: "1px dashed var(--color-gold-800)",
          opacity: 0.08,
        }}
      />



      {/* --- Main brain container (Pill shaped) --- */}
      <div
        className={`relative flex flex-col w-full lg:w-[540px] overflow-hidden ${
          isReceiving ? "animate-center-receive" : ""
        }`}
        style={{
          height: "clamp(430px, 60vh, 540px)",
          borderRadius: "4rem", /* Deep pill/capsule shape */
          border: `1px solid ${isReceiving ? "var(--color-gold-500)" : "var(--color-gold-800)"}`,
          boxShadow: isReceiving 
            ? "0 0 40px rgba(212,160,23,0.2), inset 0 1px 1px rgba(255,255,255,0.05)" 
            : "0 0 20px rgba(212,160,23,0.05), inset 0 1px 1px rgba(255,255,255,0.05)",
          backgroundColor: "#080808",
          backdropFilter: "blur(12px)",
          transition: "box-shadow var(--transition-normal), border-color var(--transition-normal)",
        }}
      >
        {/* Removed internal cerebro graphic inside the core */}
        <div className="absolute inset-0 z-0 bg-transparent" />

        {/* --- Content (header + chat + input) --- */}
        <div className="relative z-10 flex flex-col h-full">
          {/* Header */}
          <div
            className="flex items-center justify-center gap-2 shrink-0"
            style={{
              padding: "var(--space-sm) var(--space-md)",
              borderBottom: "1px solid var(--color-border-default)",
              background: "rgba(10,10,10,0.6)",
              backdropFilter: "blur(8px)",
            }}
          >
            {/* Pulse indicator */}
            <div
              className={`${isReceiving ? "animate-pulse-glow" : ""}`}
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "var(--radius-full)",
                background: isReceiving
                  ? "var(--color-gold-400)"
                  : "var(--color-gold-700)",
                transition: "background var(--transition-normal)",
              }}
            />
            <span
              className="text-xs font-semibold tracking-widest uppercase"
              style={{ color: "var(--color-text-accent)" }}
            >
              Asistente de desarrollo
            </span>
            {/* Processing badge */}
            {isReceiving && (
              <span
                className="text-[9px] font-semibold tracking-wider uppercase animate-fade-in"
                style={{
                  padding: "1px var(--space-sm)",
                  background: "var(--color-accent-subtle)",
                  border: "1px solid var(--color-gold-800)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--color-gold-400)",
                }}
              >
                Wird verarbeitet...
              </span>
            )}
          </div>

          {/* Chat + input via children */}
          {children}
        </div>
      </div>
    </div>
  );
}
