---
name: agentia-brand-guidelines
description: Applies AgentIA-Automate's official brand identity — black/gold palette, electric motion tokens, typography, and design language — to any artifact, component, document, or UI element in this project. Use it when generating new UI components, writing copy, creating presentations, designing emails, producing marketing materials, building dashboard views, or whenever visual consistency with the agentia-automate.ch brand identity is required. Always trigger this skill when someone asks to "style something", "apply the brand", "make it look like the platform", or "use the AgentIA design system".
---

# AgentIA-Automate Brand Guidelines

## Brand Identity

**Platform**: AgentIA-Automate  
**Domain**: agentia-automate.ch  
**Positioning**: Premium AI orchestration platform. Cinematic, technical, authoritative.  
**Tone**: Precise. Restrained. Powerful. Never playful, never corporate-generic.

---

## Color System

All colors are defined as CSS custom properties in `src/app/globals.css`.  
**Never use hardcoded hex values in components — always reference the CSS variable.**

### Surface Colors (Dark Theme — Default)

| Token | Value | Use |
|---|---|---|
| `--color-surface-primary` | `#0a0a0a` | Page background |
| `--color-surface-secondary` | `#111111` | Card / panel backgrounds |
| `--color-surface-elevated` | `#1a1a1a` | Raised elements, inputs |
| `--color-surface-overlay` | `rgba(10,10,10,0.85)` | Modals, tooltips |

### Gold Accent Palette

The gold palette is the **only accent color family** used on this platform.  
No blues, purples, reds, or greens for brand elements — those are reserved for system status only.

| Token | Value | Use |
|---|---|---|
| `--color-gold-400` | `#facc15` | Active states, highlights |
| `--color-gold-500` | `#d4a017` | Primary accent (icons, borders) |
| `--color-gold-600` | `#b8860b` | Hover states |
| `--color-gold-700` | `#92690a` | Borders, dashed lines |
| `--color-gold-800` | `#6b4f0a` | Subtle borders, muted accents |
| `--color-gold-900` | `#45330a` | Subtle backgrounds on dark |

### Semantic Tokens

| Token | Value | Use |
|---|---|---|
| `--color-accent` | `--color-gold-500` | Default accent |
| `--color-accent-hover` | `--color-gold-400` | Hover on accent |
| `--color-accent-subtle` | `--color-gold-900` | Accent tinted background |
| `--color-text-primary` | `#f5f5f5` | Body text |
| `--color-text-secondary` | `#a3a3a3` | Secondary text |
| `--color-text-muted` | `#525252` | Disabled / placeholder |
| `--color-text-accent` | `--color-gold-400` | Emphasized text, labels |
| `--color-border-default` | `#262626` | Neutral borders |
| `--color-border-accent` | `--color-gold-700` | Gold-tinted borders |

### Status Colors (System Only — Not for Branding)

These are for functional status indicators only, not decorative branding:

| Status | Color |
|---|---|
| Pending | `#facc15` |
| Running | `#3b82f6` |
| Completed | `#22c55e` |
| Failed | `#ef4444` |

---

## Typography

| Token | Stack | Use |
|---|---|---|
| `--font-sans` | Geist Sans → system-ui → sans-serif | All UI text |
| `--font-mono` | Geist Mono → Fira Code → monospace | Code, IDs, technical values |

### Text Hierarchy

```
Display:   2.5rem–4rem  / font-bold  / tracking-tight / --color-text-accent
H1:        1.875rem     / font-bold  / tracking-tight / --color-text-primary
H2:        1.25rem      / font-semibold              / --color-text-primary
H3:        1rem         / font-semibold              / --color-text-secondary
Body:      0.875rem     / font-normal / leading-relaxed / --color-text-primary
Small:     0.75rem      / font-medium                / --color-text-secondary
Micro:     0.625rem     / font-semibold / tracking-wider / uppercase / --color-text-muted
```

---

## Spacing Scale

Always use the spacing tokens — never arbitrary pixel values.

| Token | Value |
|---|---|
| `--space-xs` | `0.25rem` |
| `--space-sm` | `0.5rem` |
| `--space-md` | `1rem` |
| `--space-lg` | `1.5rem` |
| `--space-xl` | `2rem` |
| `--space-2xl` | `3rem` |
| `--space-3xl` | `4rem` |

---

## Border Radius

| Token | Value | Use |
|---|---|---|
| `--radius-sm` | `0.375rem` | Tags, badges |
| `--radius-md` | `0.5rem` | Buttons, inputs |
| `--radius-lg` | `0.75rem` | Cards |
| `--radius-xl` | `1rem` | Panels |
| `--radius-full` | `9999px` | Circles, pills |

---

## Shadows & Glow

| Token | Value | Use |
|---|---|---|
| `--shadow-glow-sm` | `0 0 8px rgba(212,160,23,0.15)` | Idle nodes |
| `--shadow-glow-md` | `0 0 16px rgba(212,160,23,0.2)` | Active elements |
| `--shadow-glow-lg` | `0 0 32px rgba(212,160,23,0.25)` | Core/brain focal point |

---

## Motion System

Electric motion communicates information flow between agents and the orchestrator.  
All animations are defined as CSS classes in `globals.css`.

| Class | Purpose |
|---|---|
| `animate-pulse-glow` | Ambient brain glow (always on) |
| `animate-spin-slow` | Orbital ring (20s, very subtle) |
| `animate-fade-in` | Page/component entry |
| `animate-electric-flow` | Active connection path (dashed stroke) |
| `animate-node-working` | Agent processing state |
| `animate-center-receive` | Brain core receiving agent output |
| `animate-gold-shimmer` | Antigravity refinement stage text |

### Motion Principles

- Motion communicates **state change**, not decoration
- Use `animate-node-working` only when an agent is actively processing
- **Never** stack more than 2 simultaneous animations on one element
- All animations respect `prefers-reduced-motion: reduce` — they are disabled in that context

---

## Agent Node Visual Identity

All 6 specialist agents use the **gold palette only**.  
Intensity communicates status, not a different color:

| Status | Border | Glow | Icon Opacity |
|---|---|---|---|
| `idle` | `--color-gold-800` | 6px / 6% | 40% |
| `active` | `--color-gold-600` | 12px / 18% | 70% |
| `working` | `--color-gold-500` | 20px / 35% | 100% |
| `completed` | `--color-gold-400` | 14px / 22% | 80% |

**Antigravity Prompt Engineer** is the only agent with a visual distinction:  
- Larger node (60px vs 50px)
- Outer dashed ring (`--color-gold-600`, 25% opacity)
- Label: "Final Refinement" in `--color-gold-700`
- Uses `animate-gold-shimmer` during active refinement

---

## UI Component Patterns

### Buttons

```css
/* Primary */
background: var(--color-accent);
color: var(--color-surface-primary);
border-radius: var(--radius-md);
border: none;
padding: var(--space-sm) var(--space-xl);
font-weight: 600;
transition: var(--transition-fast);

/* Hover: background → var(--color-accent-hover) */
```

### Input Fields

```css
background: var(--color-surface-elevated);
border: 1px solid var(--color-border-default);
border-radius: var(--radius-md);
color: var(--color-text-primary);
padding: var(--space-sm) var(--space-md);
/* Focus: border-color → var(--color-gold-700) */
```

### Cards / Panels

```css
background: var(--color-surface-secondary);
border: 1px solid var(--color-border-default);
border-radius: var(--radius-xl);
/* Accent variant: border-color → var(--color-border-accent) */
/* box-shadow: var(--shadow-glow-sm) on hover/active */
```

### Badges / Tags

```css
background: var(--color-accent-subtle);
border: 1px solid var(--color-gold-800);
border-radius: var(--radius-sm);
color: var(--color-text-accent);
font-size: 10px;
font-weight: 600;
text-transform: uppercase;
letter-spacing: 0.08em;
```

---

## Copy & Language Guidelines

- **Source code**: English only (variable names, comments, functions)
- **User-facing UI text**: Standard High German (Schweizer Hochdeutsch), always using `ss` instead of `ß` (e.g. "Strasse" not "Straße", "heissen" not "heißen").
- **Dialect**: DO NOT use Swiss German dialect. Use proper standard German grammar and vocabulary.
- **Tone**: Minimal, precise, technical. No exclamation marks. No filler words.
- **CTA buttons**: Action verbs in standard German (e.g. "Senden", "Anmelden", "Fortfahren")
- **Section labels**: Uppercase, letter-spaced, `--color-text-muted`
- **Error messages**: Specific and actionable — never "Something went wrong"

### Copy Examples

| Context | ❌ Avoid | ✅ Use |
|---|---|---|
| Input placeholder | "Type your message..." / "Schrib dini Afrag..." | "Schreibe deine Anfrage..." |
| Send button | "Send" / "Sände" | "Senden" / "Abschicken" |
| Login button | "Sign in" / "Aamälde" | "Anmelden" |
| Status label | "Processing..." / "Am Verarbeite..." | "Wird verarbeitet..." |
| Empty state | "No results found" / "Kei Ergebniss gfunde" | "Keine Ergebnisse gefunden" |

---

## Brand Identity Assets

- **Logomark**: "AI" text in a gold square (`--color-accent` background, `--color-surface-primary` text), `--radius-md`
- **Wordmark**: "AgentIA" in `--color-text-primary` / bold + "Automate" in `--color-text-muted` / uppercase / tracked
- **Domain tag**: `agentia-automate.ch` in mono font, `--color-text-muted`

Logo component: `src/components/ui/logo.tsx`

---

## What to Avoid

- ❌ Hardcoded hex values (always use CSS tokens)
- ❌ Colors outside the gold palette for brand decoration
- ❌ Light backgrounds (the platform is always dark)
- ❌ Multiple simultaneous animations on a single element
- ❌ Standard German `ß` in any UI text
- ❌ Bright, saturated non-gold accents on interactive UI elements
- ❌ Rounded-rectangle agent thumbnails (always use `--radius-full` circles for nodes)
- ❌ Emojis in production UI (only used in demo/placeholder states)
- ❌ Sans-serif italic (not part of the brand voice — use `font-semibold` for emphasis instead)
