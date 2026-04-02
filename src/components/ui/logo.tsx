// =============================================================================
// AgentIA-Automate — Logo Component (Brand Asset)
// =============================================================================
// Uses the official logotipo.webp from /public.
// Fixed bottom-left. Pure visual, no logic.
// =============================================================================

import Image from "next/image";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const SIZE_MAP = {
  sm: { img: 32, text: "text-xs" },
  md: { img: 44, text: "text-sm" },
  lg: { img: 64, text: "text-base" },
};

export function Logo({ className = "", size = "md" }: LogoProps) {
  const { img, text } = SIZE_MAP[size];

  return (
    <div
      className={`flex items-center gap-2 select-none ${className}`}
      style={{ fontFamily: "var(--font-sans)" }}
    >
      <Image
        src="/logotipo.webp"
        alt="AgentIA logo"
        width={img}
        height={img}
        className="object-contain"
        style={{ filter: "drop-shadow(0 0 6px rgba(212,160,23,0.3))" }}
        priority
      />
      <div className="flex flex-col leading-none">
        <span
          className={`${text} font-bold tracking-tight`}
          style={{ color: "var(--color-text-primary)" }}
        >
          Agent-IA
        </span>
        <span
          className="text-[9px] font-medium tracking-widest uppercase"
          style={{ color: "var(--color-text-muted)" }}
        >
          automate.ch
        </span>
      </div>
    </div>
  );
}
