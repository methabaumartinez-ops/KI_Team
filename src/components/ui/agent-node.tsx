// =============================================================================
// AgentIA-Automate — Agent Node (Gold Palette + Status States)
// =============================================================================
// Individual agent displayed as a radial node around the brain core.
// All nodes use the gold palette — no individual agent colors.
// Supports idle / active / working / completed status animations.
// =============================================================================

import Image from "next/image";
import type { AgentDefinition } from "@/lib/antigravity/agent-registry";

// ---------------------------------------------------------------------------
// Status → gold intensity mapping
// ---------------------------------------------------------------------------

export type AgentNodeStatus = "idle" | "active" | "working" | "completed" | "failed";

const STATUS_STYLES: Record<
  AgentNodeStatus,
  { border: string; glow: string; iconOpacity: number }
> = {
  idle: {
    border: "var(--color-gold-800)",
    glow: "0 0 6px rgba(212, 160, 23, 0.06)",
    iconOpacity: 0.4,
  },
  active: {
    border: "var(--color-gold-600)",
    glow: "0 0 12px rgba(212, 160, 23, 0.18)",
    iconOpacity: 0.7,
  },
  working: {
    border: "var(--color-gold-500)",
    glow: "0 0 20px rgba(212, 160, 23, 0.35)",
    iconOpacity: 1,
  },
  completed: {
    border: "var(--color-gold-400)",
    glow: "0 0 14px rgba(212, 160, 23, 0.22)",
    iconOpacity: 0.8,
  },
  failed: {
    border: "var(--color-status-failed)",
    glow: "0 0 14px rgba(239, 68, 68, 0.2)",
    iconOpacity: 0.5,
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface AgentNodeProps {
  agent: AgentDefinition;
  index: number;
  total: number;
  status?: AgentNodeStatus;
  isRefinementAgent?: boolean;
  onSelect?: (agent: AgentDefinition) => void;
}

export function AgentNode({
  agent,
  index,
  total,
  status = "idle",
  isRefinementAgent = false,
  onSelect,
}: AgentNodeProps) {
  // 1. Isolate the "North Star" Prompt Engineer
  const isNorthStar = isRefinementAgent;

  let targetX = 0;
  let targetY = 0;
  let nodeSize = 108; // 50% larger base size (72 * 1.5)
  
  // The Chat Core is anchored vertically at +35%. We target the curve relative to that.
  // Lowered Y offset to hit the slightly shorter BrainCore safely.
  const coreTargetY = 230;

  if (isNorthStar) {
    nodeSize = 138; // 50% larger top size (92 * 1.5)
    // Raised the zenith node back up to escape the newly widened Chat overlay
    targetX = 0;
    targetY = -360;
  } else {
    // 2. Sequential Flank Mapping (skip prompt-engineer index to pack 0-5)
    const flankIndex = index > 2 ? index - 1 : index;
    const isLeft = flankIndex < 3;
    const tier = flankIndex % 3;
    
    // Ellipse coordinates forming a semi-circle arch hugging the Chat
    // Widened X coordinates significantly to prevent the 540px Chat from hiding the avatars
    const targetXList = [330, 530, 380];
    const targetYList = [-240, -10, 220]; 
    
    targetX = isLeft ? -targetXList[tier] : targetXList[tier];
    targetY = targetYList[tier];
  }

  const styles = STATUS_STYLES[status];

  // --- Neural Math Geometry ---
  const isLeftAgent = targetX < 0 && !isNorthStar;
  
  // We pin the SVG origin EXACTLY to the center of the circular avatar.
  const originX = targetX;
  const originY = targetY;

  // Instead of calculating complex math to hit the precise curved borders of the Chat, 
  // we route all cables directly to its physical internal spine. Because the BrainCore renders 
  // visually on top of the Agents in the DOM, the cables will realistically vanish "behind" it
  // yielding a flawless 3D hardware insertion effect on any screen size.
  const destinationX = 0;
  // Aim deep into the vertical belly of the UI (100px below the Constellation 0-anchor point)
  const destinationY = 100;

  // Calculate Relative Delta from the SVG absolute origin (avatar center) to the Destination
  const deltaX = destinationX - originX;
  const deltaY = destinationY - originY;

  // We offset it by the avatar's radius (nodeSize/2) so it doesn't draw over the image.
  const radius = nodeSize / 2;
  const startX = isNorthStar ? 0 : (isLeftAgent ? radius : -radius);
  const startY = isNorthStar ? radius : 0;

  return (
    <button
      onClick={() => onSelect?.(agent)}
      className={`absolute flex flex-col items-center cursor-pointer ${
        status === "working" ? "animate-node-working" : ""
      }`}
      style={{
        transform: `translate(calc(${targetX}px - 50%), calc(${targetY}px - 50%))`,
        transition: "var(--transition-normal)",
        background: "none",
        border: "none",
        padding: 0,
        zIndex: status === "working" ? 50 : 10,
      }}
      title={agent.description}
      id={`agent-node-${agent.slug}`}
    >
        {/* --- Node Core --- */}
        <div
          className="relative overflow-hidden z-10 shrink-0"
          style={{
            width: `${nodeSize}px`,
            height: `${nodeSize}px`,
          borderRadius: "var(--radius-full)",
          background: "var(--color-surface-elevated)",
          border: `2px solid ${styles.border}`,
          boxShadow: styles.glow,
          transition: "var(--transition-normal)",
        }}
      >
        <Image
          src="/cerebro.jpg"
          alt={agent.name}
          fill
          className="object-cover"
          style={{
            opacity: styles.iconOpacity,
            transition: "var(--transition-fast)",
            filter: "sepia(100%) hue-rotate(5deg) saturate(300%) contrast(1.2)",
            mixBlendMode: status === "idle" ? "luminosity" : "normal",
          }}
        />
        {/* Subtle gold overlay when working */}
        {(status === "working" || status === "active") && (
           <div 
             className="absolute inset-0 pointer-events-none mix-blend-overlay"
             style={{ background: "rgba(212,160,23,0.3)" }}
           />
        )}
      </div>

      {/* Label */}
      <span
        className="text-[11px] font-semibold whitespace-nowrap mt-2"
        style={{
          color: "var(--color-text-primary)",
          textShadow: "0 2px 4px rgba(0,0,0,0.9), 0 1px 2px rgba(0,0,0,1)",
          transition: "var(--transition-fast)",
        }}
      >
        {agent.name}
      </span>

      {/* Electric Neural Connection */}
      <svg
        className="absolute pointer-events-none"
        style={{
          width: "1px",
          height: "1px",
          overflow: "visible",
          top: `${radius}px`,
          left: `50%`,
          zIndex: -1,
        }}
      >
        <path
          d={`M ${startX},${startY} C ${
             isNorthStar ? 0 : (deltaX * 0.4) 
          },${
             isNorthStar ? (deltaY * 0.4) : 0
          } ${
             isNorthStar ? 0 : (deltaX * 0.6)
          },${deltaY} ${deltaX},${deltaY}`}
          fill="none"
          stroke="var(--color-gold-600)"
          strokeWidth={status === "idle" ? "1.5" : "3.5"}
          strokeDasharray={status === "working" ? "12 8" : "none"}
          className={status === "working" ? "animate-electric-flow" : ""}
          style={{
            opacity: status === "idle" ? 0.25 : 1,
            transition: "opacity 0.4s ease-in-out, filter 0.3s ease, stroke-width 0.3s ease",
            filter: status === "working" ? "drop-shadow(0 0 8px rgba(212,160,23,1))" : "none",
          }}
        />
      </svg>
    </button>
  );
}
