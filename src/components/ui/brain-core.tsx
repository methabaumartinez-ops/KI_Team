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

      {/* --- Cyber-Tribal Frame (Thorns) --- */}
      <div className="hidden lg:block absolute inset-0 pointer-events-none z-0">
         {/* Top Left Mandible */}
         <svg className="absolute -left-[35px] top-[15%] w-16 h-36" style={{ transform: 'scaleX(-1) rotate(10deg)' }} viewBox="0 0 60 120" strokeLinecap="round" strokeLinejoin="round">
            {/* Outer shadow thorn */}
            <path d="M 60,10 C 20,30 5,80 0,120 C 15,80 30,60 60,50 Z" fill="var(--color-gold-900)" opacity="0.4" />
            {/* Inner glowing cyber-thorn */}
            <path d="M 60,20 C 30,35 15,75 10,105 C 20,75 35,60 60,55 Z" fill="var(--color-gold-600)" filter="drop-shadow(0 0 8px rgba(212,160,23,0.9))" />
         </svg>

         {/* Top Right Mandible */}
         <svg className="absolute -right-[35px] top-[15%] w-16 h-36" style={{ transform: 'rotate(10deg)' }} viewBox="0 0 60 120" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 60,10 C 20,30 5,80 0,120 C 15,80 30,60 60,50 Z" fill="var(--color-gold-900)" opacity="0.4" />
            <path d="M 60,20 C 30,35 15,75 10,105 C 20,75 35,60 60,55 Z" fill="var(--color-gold-600)" filter="drop-shadow(0 0 8px rgba(212,160,23,0.9))" />
         </svg>

         {/* Bottom Left Mandible */}
         <svg className="absolute -left-[45px] bottom-[20%] w-20 h-44" style={{ transform: 'scaleX(-1) rotate(-15deg)' }} viewBox="0 0 60 120" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 60,110 C 20,90 5,40 0,0 C 15,40 30,60 60,70 Z" fill="var(--color-gold-900)" opacity="0.5" />
            <path d="M 60,100 C 30,85 15,45 10,15 C 20,45 35,60 60,65 Z" fill="var(--color-gold-400)" filter="drop-shadow(0 0 12px rgba(212,160,23,1))" />
            {/* Secundary smaller spike branching off */}
            <path d="M 60,85 C 40,75 30,50 25,30 C 35,50 45,60 60,60 Z" fill="var(--color-gold-500)" />
         </svg>

         {/* Bottom Right Mandible */}
         <svg className="absolute -right-[45px] bottom-[20%] w-20 h-44" style={{ transform: 'rotate(-15deg)' }} viewBox="0 0 60 120" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 60,110 C 20,90 5,40 0,0 C 15,40 30,60 60,70 Z" fill="var(--color-gold-900)" opacity="0.5" />
            <path d="M 60,100 C 30,85 15,45 10,15 C 20,45 35,60 60,65 Z" fill="var(--color-gold-400)" filter="drop-shadow(0 0 12px rgba(212,160,23,1))" />
            <path d="M 60,85 C 40,75 30,50 25,30 C 35,50 45,60 60,60 Z" fill="var(--color-gold-500)" />
         </svg>
      </div>

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
              Zentrale Orchestrierung
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
