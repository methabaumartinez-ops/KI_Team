---
name: antigravity-design
description: Crear interfaces visuales de alta calidad para el proyecto AgentIA-Automate (agentia-automate.ch). Usa esta skill cuando el usuario pida diseñar, mejorar o crear componentes UI para este proyecto, incluyendo el Central Orchestrator, dashboards, chats, nodos de agentes, o cualquier interfaz. Triggers incluyen "Antigravity interfaz", "diseño Antigravity", "mejorar UI", "componente nuevo", "crea un dashboard", "agrega una vista", o cualquier solicitud de UI/UX para este proyecto. Produce código React/TypeScript limpio, evita superposiciones, mantiene la paleta gold/negro, garantiza contraste correcto y siempre usa los CSS tokens del proyecto en lugar de valores hardcodeados.
---

# Antigravity Design Skill — AgentIA-Automate

## Archivos de Referencia del Proyecto

Antes de crear cualquier componente, verificar estos archivos:

- **Tokens CSS**: `src/app/globals.css` — fuente de verdad de todos los colores, espaciado, radios, sombras y animaciones
- **Branding completo**: `.agent/skills/agentia-brand-guidelines/SKILL.md`
- **Componentes existentes**: `src/components/ui/` y `src/components/features/`
- **Tipos de dominio**: `src/types/index.ts`
- **Registro de agentes**: `src/lib/antigravity/agent-registry.ts`

> **Regla crítica**: Nunca usar valores hex o px hardcodeados. Siempre `var(--token)`.

---

## Paleta de Colores (Tokens Activos)

### Superficies (fondo oscuro — siempre)

| Token CSS | Valor | Uso |
|---|---|---|
| `--color-surface-primary` | `#0a0a0a` | Fondo de página |
| `--color-surface-secondary` | `#111111` | Cards, paneles |
| `--color-surface-elevated` | `#1a1a1a` | Inputs, elementos elevados |
| `--color-surface-overlay` | `rgba(10,10,10,0.85)` | Modales, overlay |

### Paleta Gold (único acento para branding)

| Token CSS | Uso |
|---|---|
| `--color-gold-400` | Estados activos, highlights |
| `--color-gold-500` | Acento primario (iconos, bordes activos) |
| `--color-gold-600` | Hover states |
| `--color-gold-700` | Bordes sutiles, líneas |
| `--color-gold-800` | Bordes muy sutiles |
| `--color-gold-900` | Fondos con tinte dorado |
| `--color-accent` | Alias → `--color-gold-500` |
| `--color-accent-hover` | Alias → `--color-gold-400` |
| `--color-accent-subtle` | Alias → `--color-gold-900` |

### Texto

| Token CSS | Uso |
|---|---|
| `--color-text-primary` | `#f5f5f5` — cuerpo principal |
| `--color-text-secondary` | `#a3a3a3` — texto secundario |
| `--color-text-muted` | `#525252` — placeholders, deshabilitados |
| `--color-text-accent` | → `--color-gold-400` — etiquetas enfatizadas |

### Colores de Estado (solo funcional, no decorativo)

```
pending:   #facc15   running:  #3b82f6
completed: #22c55e   failed:   #ef4444
```

---

## Tokens de Espaciado

```css
--space-xs: 0.25rem  |  --space-sm: 0.5rem
--space-md: 1rem     |  --space-lg: 1.5rem
--space-xl: 2rem     |  --space-2xl: 3rem  |  --space-3xl: 4rem
```

## Border Radius

```css
--radius-sm: 0.375rem  |  --radius-md: 0.5rem
--radius-lg: 0.75rem   |  --radius-xl: 1rem  |  --radius-full: 9999px
```

## Sombras y Glow

```css
--shadow-glow-sm: 0 0 8px rgba(212,160,23,0.15)
--shadow-glow-md: 0 0 16px rgba(212,160,23,0.2)
--shadow-glow-lg: 0 0 32px rgba(212,160,23,0.25)
```

---

## Sistema de Animaciones

Clases disponibles — usar solo para comunicar estado, no como decoración:

| Clase CSS | Cuándo usar |
|---|---|
| `animate-pulse-glow` | Glow ambiental permanente (brain core) |
| `animate-spin-slow` | Anillo orbital (20s, muy sutil) |
| `animate-fade-in` | Entrada de componentes |
| `animate-electric-flow` | Línea de conexión activa entre agente y centro |
| `animate-node-working` | Nodo de agente procesando |
| `animate-center-receive` | Brain core recibiendo respuesta |
| `animate-gold-shimmer` | Texto de refinamiento final |

**Nunca** apilar más de 2 animaciones simultáneas en un elemento.  
Todas respetan `prefers-reduced-motion: reduce`.

---

## Principios de Diseño

### 1. Sin Superposiciones
- Layout con **flexbox o grid** explícito
- `z-index` declarado solo cuando es estructuralmente necesario
- Máximo 3 capas de profundidad visual
- Espaciado mínimo entre elementos: `var(--space-md)`

### 2. Contraste y Legibilidad
- WCAG AA mínimo (4.5:1 para texto)
- Gold `#d4a017` sobre negro `#0a0a0a` → contraste 7.2:1 ✅
- Blanco `#f5f5f5` sobre `#1a1a1a` → contraste 11.4:1 ✅
- Nunca texto gris claro sobre superficie gris oscuro

### 3. Integración de Imágenes de Marca
- `cerebro.jpg` → fondo con `opacity: 0.04–0.22` según nivel de jerarquía
- `logotipo.webp` → usar componente `<Logo />` de `src/components/ui/logo.tsx`
- Siempre añadir gradiente oscuro sobre imagen para mantener legibilidad del texto encima

### 4. Jerarquía del Orchestrator
El Central Orchestrator es siempre el elemento dominante:
```
1. Brain Core + Chat (centro, z-10)
2. Nodos de Agentes (radiales, z-0)
3. Líneas de conexión (SVG, pointer-events-none)
4. Logo (fixed bottom-left, z-20)
```

---

## Patrones de Componentes

### Card / Panel

```tsx
<div style={{
  background: "var(--color-surface-secondary)",
  border: "1px solid var(--color-border-default)",
  borderRadius: "var(--radius-xl)",
  padding: "var(--space-lg)",
  boxShadow: "var(--shadow-glow-sm)",
}}>
```

**Variante accent** (para elementos activos o destacados):
```tsx
border: "1px solid var(--color-border-accent)"
boxShadow: "var(--shadow-glow-md)"
```

### Botón Primario

```tsx
<button style={{
  background: "var(--color-accent)",
  color: "var(--color-surface-primary)",
  borderRadius: "var(--radius-md)",
  padding: "var(--space-sm) var(--space-xl)",
  border: "none",
  fontWeight: 600,
  transition: "var(--transition-fast)",
}}>
  Abschicke
</button>
```

### Botón Secundario (outline)

```tsx
<button style={{
  background: "transparent",
  color: "var(--color-text-accent)",
  borderRadius: "var(--radius-md)",
  padding: "var(--space-sm) var(--space-xl)",
  border: "1px solid var(--color-gold-700)",
  transition: "var(--transition-fast)",
}}>
```

### Input / Textarea

```tsx
<input style={{
  background: "var(--color-surface-elevated)",
  border: "1px solid var(--color-border-default)",
  borderRadius: "var(--radius-md)",
  color: "var(--color-text-primary)",
  padding: "var(--space-sm) var(--space-md)",
  // Focus: border-color → var(--color-gold-700)
}} />
```

### Badge / Tag

```tsx
<span style={{
  background: "var(--color-accent-subtle)",
  border: "1px solid var(--color-gold-800)",
  borderRadius: "var(--radius-sm)",
  color: "var(--color-text-accent)",
  fontSize: "10px",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  padding: "2px var(--space-sm)",
}}>
```

### Separador / Línea

```tsx
<div style={{
  borderTop: "1px solid var(--color-border-default)",
  margin: "var(--space-md) 0",
}} />
```

---

## Tipografía

```css
/* Tokens de fuente del proyecto */
--font-sans: Geist Sans → system-ui → sans-serif
--font-mono: Geist Mono → Fira Code → monospace
```

### Jerarquía

| Nivel | Tamaño | Peso | Color |
|---|---|---|---|
| Display | 2.5–4rem | 700 | `--color-text-accent` |
| H1 | 1.875rem | 700 | `--color-text-primary` |
| H2 | 1.25rem | 600 | `--color-text-primary` |
| H3 | 1rem | 600 | `--color-text-secondary` |
| Body | 0.875rem | 400 | `--color-text-primary` |
| Small | 0.75rem | 500 | `--color-text-secondary` |
| Micro | 0.625rem | 600, uppercase, tracked | `--color-text-muted` |

---

## Idioma de la UI

**Toda la UI visible va en Alemán Estándar (Schweizer Hochdeutsch)**:
- Usar SIEMPRE `ss` en lugar de `ß` (ej: `heissen`, `gross`, nunca `heißen` o `groß`)
- Usar umlauts `ü`, `ä`, `ö` correctamente
- Usar Hochdeutsch (Alemán Estándar), **NO usar dialecto Suizo-Alemán**
- Código fuente (variables, funciones, comentarios) en inglés

### Vocabulario clave

| Contexto | Texto correcto |
|---|---|
| Botón enviar | `Abschicken` |
| Botón login | `Anmelden` |
| Procesando | `Wird verarbeitet...` |
| Bienvenida | `Willkommen bei AgentIA` |
| Placeholder input | `Schreibe deine Frage...` |
| Estado activo | `Aktiv` |
| Estado completado | `Abgschlosse` |
| Agente trabajando | `Am Analysiere...` |

---

## Proceso de Implementación

Cuando recibas una solicitud de UI:

1. **Verificar** qué componentes existen ya en `src/components/ui/` y `src/components/features/`
2. **Reutilizar** componentes existentes (`<Logo />`, `<BrainCore />`, `<AgentNode />`, `<InputBar />`, `<RefinementBadge />`)
3. **Diseñar** el layout en mental antes de escribir código
4. **Implementar** con tokens CSS, no valores hardcodeados
5. **Validar checklist**:
   - ✅ Sin valores hex hardcodeados
   - ✅ Sin superposiciones (z-index innecesarios)
   - ✅ Contraste correcto (texto legible)
   - ✅ Responsive (mobile: columna, desktop: layout completo)
   - ✅ Textos en Alemán Estándar (Schweizer Hochdeutsch) con `ss` y sin `ß`
   - ✅ Componente separado si > 20 líneas de UI o se reutiliza

---

## Casos de Uso Frecuentes

### Agente Card (standalone)

```tsx
// src/components/ui/agent-card.tsx
// Muestra un agente con su estado, nombre, rol y acción
// Props: agent (AgentDefinition), status (AgentNodeStatus), onSelect
```

### Panel de Historial / Log

```tsx
// Lista scrollable de ChatMessage[]
// Roles visualizados con los ROLE_STYLES de orchestrator-viewport.tsx
// Empty state: "No hei no kei Ufträg." con icono muted
```

### Modal / Overlay

```tsx
// background: "var(--color-surface-overlay)"
// backdrop-filter: blur(8px)
// border: "1px solid var(--color-border-accent)"
// border-radius: "var(--radius-xl)"
// z-index: 50 máximo
```

### Notificación / Toast

```tsx
// Fixed bottom-right, z-30
// Variantes: success (gold-400), error (status-failed), info (text-secondary)
// Auto-dismiss: 4s con fade-out
```

---

## Qué Evitar

- ❌ Valores hex hardcodeados (`#d4a017` → usar `var(--color-accent)`)
- ❌ Colores fuera de la paleta gold para branding (sin azul, rojo, verde decorativos)
- ❌ Fondos claros (la plataforma es siempre dark)
- ❌ Más de 2 animaciones simultáneas en un elemento
- ❌ `ß` en cualquier texto de UI (usar `ss`)
- ❌ Dialecto Suizo-Alemán (usar Standard Hochdeutsch)
- ❌ Lógica de negocio mezclada con componentes UI
- ❌ Nodos de agentes con colores individuales (todo es gold con intensidad variable)
- ❌ Z-index arbitrarios (solo estructurales: `z-0`, `z-10`, `z-20`, `z-30`, `z-50`)
