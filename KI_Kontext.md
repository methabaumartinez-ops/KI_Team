# 🧠 KI_Kontext: AgentIA Automate - Documentación Maestra (Contexto para Agentes LLM)

Este archivo es el **Cerebro Base de Conocimiento** del proyecto "AgentIA Automate". Cualquier IA interactuando con este proyecto DEBE leer y asimilar profundamente este documento antes de sugerir o modificar código, librerías o arquitectura.

---

## 1. 🎯 Filosofía del Proyecto y Arquitectura Lógica

**Product Name:** AgentIA Automate
**Patrón Arquitectónico Backend:** Conversational Mixture of Experts (MoE) State Machine.
**Objetivo Conceptual:** Una cabina de mando (Command Center) donde el usuario dialoga con un "Asistente de desarrollo" líder. Este asistente recoge requisitos, ejecuta RAG sobre documentos adjuntos y, cuando la tarea técnica es clara, disgrega el trabajo disparando un "Enjambre (Swarm)" de agentes especializados en paralelo. Todo lo compilado por el enjambre se fusiona en un Prompt de código perfecto estructurado por el "Prompt Engineer".

---

## 2. 🧰 Stack Tecnológico Base

- **Framework Web:** Next.js 14/15 con App Router (`src/app/`).
- **Librería UI:** React 19.
- **Estilizado:** Tailwind CSS v4, gestionado mediando CSS Vanilla Mapeado (`src/app/globals.css`). Arquitectura atómica usando variables SEMÁNTICAS (ej: `var(--color-gold-500)`).
- **Controlador IA:** Vercel AI SDK Core (`ai` library, usando `streamText`, `generateText`, `tool`).
- **Motor Neuronal (LLM):** Google Gemini (`@ai-sdk/google`).
  - Modelos actívos: `gemini-2.5-flash` (Razonamiento) y `text-embedding-004` (Vectores, 768 dimensines).

---

## 3. 💾 Estructura de Datos (Persistencia y Memoria)

El sistema opera con dos cerebros de datos separados: Relacional (Supabase) y Vectorial Semántico (Qdrant).

### 3.1. Supabase (BBDD Relacional)
Ubicación del cliente: `src/lib/supabase/server.ts`
Tablas activas:
1. `agents`: Registro del Enjambre.
   - Columnas: `id`, `slug` (ej: devops-engineer), `name`, `system_prompt` (configurable por el admin).
2. `sessions`: Tracker de multi-turno.
   - Columnas: `id` (UUID), `title`, `created_at`.
3. `messages`: El historial de "Chat" que provee memoria (Persistent Memory) a la IA.
   - Columnas: `id`, `session_id` (FK), `role` (user, assistant, refined, tool), `content`, `agent_slug`.

### 3.2. Qdrant (Memoria Vectorial - RAG)
Ubicación del cliente: `src/lib/qdrant/client.ts` e Ingesta en `src/app/api/documents/ingest/route.ts`
- **Host Local:** `localhost:6333`
- **Host Producción:** `ki_team_qdrant` (red interna de Docker)
- **Colección:** `agentia_docs_v2` (Cosine Similarity, Dimensiones: `768` para Gemini embedding).
- **Flujo:** La herramienta RAG fragmenta archivos (ej: Markdown, texto plano) utilizando RecursiveTextSplitter, crea embeddings en Google y los inyecta. Almacenamos `{ filename, text }` en el *payload* de Qdrant.

---

## 4. 🧠 La Arquitectura API Mixta (El "Orquestador")

Ruta del núcleo: `src/app/api/orchestrator/route.ts`
Este Endopoint NO USUAL procesa Server-Sent Events (SSE) manuales de la siguiente forma:

1. **Memoria de Sesión:** Agarra el `sessionId` enviado por el frontend, mapea los últimos 10 mensajes desde la base de datos de Supabase y los inyecta como `msgHistory` genérico.
2. **Motor de Inferencia Conversacional:** Enciende `generateText` de Vercel SDK utilizando la IA del "Asistente de Desarrollo". El bucle se maneja **manualmente** limitando las recesiones lógicas (aprox. 2 iteraciones):
3. **Llamadas a Herramientas (*Tool Calling*):** Las herramientas NO ejecutan por sí solas. La API parsea `toolCalls[0]`:
   - `query_database`: Interroga Qdrant y reinyecta los resultados (`src/lib/qdrant/search.ts`) de vuelta a `msgHistory` para forzar otra inferencia en el LLM.
   - `delegate_to_swarm`: Indica que el asistente terminó la charla y extrajo toda la información. Trae en el input un array estricto con qué Agente llamar y qué instrucción enviarle.
4. **Ejecución Paralela del Enjambre:** Si se activa `delegate_to_swarm`, la API levanta promesas simultáneas a múltiples LLMs independientes utilizando sus propios `system_prompts` de Supabase apuntados al prompt sub-descompuesto.
5. **Síntesis del Prompt Engineer:** El Orchestrator fusiona las respuestas independientes en texto plano `[Agente: slug]: result` y activa por fin la herramienta `streamText` al último agente (Prompt Engineer) para escupir la respuesta SSE hacia la UI trozo a trozo.
6. **Integridad SSE:** Los eventos mandados explícitamente (`sendEvent`) controlan el UI Frontal (`event: status`, `event: text`, `event: sessionId`).

---

## 5. 🎨 UI/UX y Sistema de Diseño Científico

El Frontend NO es una simple pantalla plana de chat. Usa un sistema de anclajes radales pseudo-3D.

Ubicación principal: `src/components/features/orchestrator-viewport.tsx` y `src/components/ui/`
1. **BrainCore (`brain-core.tsx`):** Container principal vertical que se flexiona bajo reglas de Mobile Strict (`justify-end pb-12`). La altura nunca crece estirando el documento padre, utiliza `auto-scroll` nativo en el bloque nearest para no romper la física espacial.
2. **Constelación de Nodos (`agent-node.tsx`):**
   - El ecosistema Dibuja líneas CSS Eléctricas (Etiquetas SVG físicas `<path>`) entre los Avatares flotantes y el `BrainCore`.
   - **IMPORTANTE MATEMÁTICA:** Los cables SVG mapean `destinationX = 0` y `destinationY = 100` y el Render z-Index los oculta por debajo de los bordes del Hub principal, de forma que simulen un "conector trasero de Hardware profundo" perfecto en pantallas gigantes o enanas de igual manera sin usar offsets duros mágicos.
   - Los avatares que operan levantan animaciones estroboscópicas (`animate-electric-flow`, `strokeDasharray`, opacidad 1), los hilos en Idle nunca desaparecen (`opacity: 0.25`) para mantener consistencia de presencia.
3. El frontend rastrea recursivamente el React State de cada agente individual en base al *chunked ping* SSE de status del Orchestrador.

---

## 6. 🚀 Estrategia de Despliegue (DevOps)

- El despliegue de Producción se coordina por **Easypanel (VPS Cloud Orchestrator en Ubuntu)**.
- **Entorno Local frente a entorno Prod:** En desarrollo en Windows usamos URIs genéricas (localhost). En Easypanel todo el clúster se agrupa vía Docker Network Bridge, por tanto `.env.local` utiliza rutas de enlace dinámicas para producción en caso de DB (ej: `http://ki_team_qdrant:6333`).
- **Gestión de variables:** UTF-8 rígido en todo el `.env.local` para asegurar que credenciales de Drive API y Gemini corran en Edge-functions o Node Server Components sin reventar parseo de cadenas.

---

## REGLAS ABSOLUTAS PARA FUTUROS AGENTES LEYENDO ESTO:

1. **Atomicidad de Flujo:** Nunca alteres el archivo `/api/orchestrator/route.ts` asumiendo que `generateText` es asíncrono-trivial; respeta el bucle de herramientas (`toolCalls`) manual para la interacción interactiva.
2. **Visual Fidelity:** Cualquier cambio al HUB o Chat no debe implicar bordes duros de CSS, usa puras variables del `:root` de `globals.css` para respetar la paleta oscura de Alto contraste de AgentIA.
3. **Escabilidad:** Toda lógica de BBDD pasa por `src/lib/supabase/server.ts` con RLS saltado gracias a llaves de admin proxy.
