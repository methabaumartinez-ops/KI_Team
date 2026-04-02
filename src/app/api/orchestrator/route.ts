// =============================================================================
// AgentIA-Automate — POST /api/orchestrator
// =============================================================================
// The central orchestration endpoint.
// Uses Server-Sent Events (SSE) to stream both state updates (agent status)
// and the final text generation from the Antigravity Refinement Agent.
// =============================================================================

import { NextRequest } from "next/server";
import { streamText, generateText, tool } from "ai";
import { z } from "zod";
import { searchVectorDatabase } from "@/lib/qdrant/search";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { AGENT_DEFINITIONS } from "@/lib/antigravity/agent-registry";
import { generateStructuredAgentResponse, getActiveModel } from "@/lib/ai/provider";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { prompt, sessionId: clientSessionId } = await req.json();

  if (!prompt) {
    return new Response("Missing prompt", { status: 400 });
  }

  let supabase: ReturnType<typeof createSupabaseAdminClient> | null = null;
  try {
    supabase = createSupabaseAdminClient();
  } catch (e) {
    console.warn("Supabase not configured. Using fallback config.");
  }

  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: string, data: any) => {
        const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(payload));
      };

      try {
        let currentSessionId = clientSessionId;
        const msgHistory: any[] = [];
        
        if (supabase) {
           if (!currentSessionId) {
             const { data: sessData } = await supabase.from('sessions').insert({ title: prompt.substring(0, 50) }).select('id').single();
             if (sessData) currentSessionId = sessData.id;
             sendEvent("sessionId", { sessionId: currentSessionId });
           } else {
             // Retrieve existing history
             const { data: pastMsgs } = await supabase.from('messages')
               .select('*')
               .eq('session_id', currentSessionId)
               .order('created_at', { ascending: true })
               .limit(10);
               
             if (pastMsgs) {
               pastMsgs.forEach(m => {
                  msgHistory.push({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content });
               });
             }
           }
           
           // Log current user prompt
           if (currentSessionId) {
             await supabase.from('messages').insert({ session_id: currentSessionId, role: 'user', content: prompt });
           }
        }
        
        msgHistory.push({ role: "user", content: prompt });

        // --- 2. ORCHESTRATOR GATHERING PHASE ---
        sendEvent("status", { phase: "dispatching" });

        const orchestratorPrompt = `Eres el "Asistente Orquestador" de AgentIA. 
Tu misión no es charlar, sino actuar como un Intake & Planning manager técnico.
DIRECTRICES CRÍTICAS:
1. Analiza y Normaliza la entrada del usuario. Identifica objetivos (ej: Frontend, Backend, Infraestructura).
2. Pregunta si falta contexto (pero intenta deducir asunciones lógicas primero). Sólo bloquea el flujo si la información faltante es inasumible. Usa la herramienta 'query_database' primero si se adjuntó información.
3. CUANDO YA TENGAS EL CONTEXTO O ASUNCIONES VÁLIDAS, usa OBLIGATORIAMENTE la herramienta 'delegate_to_swarm'.
4. En el plan de delegación de 'delegate_to_swarm', indica EXACTAMENTE a qué agentes mandar, basándote en la complejidad de la tarea descrita.`;

        let shouldDelegate = false;
        let delegationPlan: any[] = [];
        let finalAssistantText = "";

        // Manual Tool Execution Loop (Max 2 iterations to allow 1 RAG query before answering/delegating)
        for (let i = 0; i < 2; i++) {
          const { text, toolCalls } = await generateText({
             model: getActiveModel(),
             system: orchestratorPrompt,
             messages: msgHistory,
             // Explicitly omit maxSteps to support all SDK versions; we handle the loop manually.
             tools: {
               query_database: (tool as any)({
                  description: "Busca información en los archivos .md y .txt cargados por el usuario en la base de datos vectorial.",
                  parameters: z.object({ query: z.string().describe("Término a buscar") })
               }),
               delegate_to_swarm: (tool as any)({
                  description: "Llama a esta herramienta SOLAMENTE cuando tengas toda la info clara y estés listo para repartir el trabajo a los agentes.",
                  parameters: z.object({
                     plan: z.array(z.object({
                       agentSlug: z.enum(["database-architect", "backend-developer", "frontend-developer", "devops-engineer", "rag-specialist"]),
                       taskInstructions: z.string().describe("Instrucciones detalladas de lo que debe hacer este agente según lo hablado con el usuario.")
                     }))
                  })
               })
             }
          });

          if (toolCalls && toolCalls.length > 0) {
             const call = toolCalls[0] as any;
             const args = call.args || call.arguments || call.input || {};
             
             if (call.toolName === "delegate_to_swarm") {
                 shouldDelegate = true;
                 delegationPlan = args.plan || [];
                 break;
             } else if (call.toolName === "query_database") {
                 sendEvent("status", { phase: "dispatching", message: "Consultando base de conocimiento..." });
                 const results = await searchVectorDatabase(args.query || "");
                 
                 // Append tool call and result to history using strict multi-modal format for Vercel AI
                 msgHistory.push({ role: 'assistant', content: '', toolCalls: [call] });
                 msgHistory.push({ 
                   role: 'tool', 
                   content: [
                     {
                       type: 'tool-result',
                       toolCallId: call.toolCallId,
                       toolName: call.toolName,
                       result: results
                     }
                   ]
                 });
                 continue; // Loop continues to generate the next step
             }
          } else {
             // No tools called, the LLM just answered
             finalAssistantText = text;
             break;
          }
        }

        // --- 3. DECISION BRANCH ---
        if (!shouldDelegate) {
           // The assistant just wants to talk to the user.
           sendEvent("status", { phase: "receiving" });
           
           // Simulate streaming character by character for the single burst `text`
           for (const char of finalAssistantText) {
             sendEvent("text", { chunk: char });
             await new Promise((r) => setTimeout(r, 10)); 
           }
           
           if (supabase && currentSessionId) {
             await supabase.from('messages').insert({ session_id: currentSessionId, role: 'refined', content: finalAssistantText, agent_slug: 'orchestrator' });
           }
           
           sendEvent("status", { phase: "idle" });
           sendEvent("done", {});
           return;
        }

        // --- 4. SWARM EXECUTION PHASE ---
        const initialStatus: Record<string, string> = {};
        delegationPlan.forEach((d) => initialStatus[d.agentSlug] = "working");
        sendEvent("status", { phase: "receiving", agentStatuses: initialStatus });

        // Retrieve system prompts
        let dbAgents: any[] | null = null;
        if (supabase) {
           const { data } = await supabase.from("agents").select("*");
           dbAgents = data;
        }

        const agentPromises = delegationPlan.map(async (taskDef) => {
           const baseDef = AGENT_DEFINITIONS.find(a => a.slug === taskDef.agentSlug) || AGENT_DEFINITIONS[0];
           const dbAgent = dbAgents?.find((a) => a.slug === taskDef.agentSlug);
           const agentPrompt = dbAgent?.system_prompt || baseDef.defaultSystemPrompt;

           try {
             // 🚀 Phase 2: JSON-Strict Enforcement
             const result = await generateStructuredAgentResponse({
               systemPrompt: `${agentPrompt}\n\nIMPORTANTE: Eres parte de un workflow semántico. El Orquestador te ha asignado un sub-objetivo basado en: "${prompt}".\nINSTRUCCIONES DE TAREA: ${taskDef.taskInstructions}\nAnaliza tu parcela y devuelve tu análisis en formato JSON estructurado según el esquema.`,
               userPrompt: `Realiza tu trabajo y devuelve el JSON estructurado.`,
             });
             sendEvent("status", { agentStatuses: { [taskDef.agentSlug]: "completed" } });
             return result;
           } catch (error) {
             sendEvent("status", { agentStatuses: { [taskDef.agentSlug]: "failed" } });
             return { agent: taskDef.agentSlug, status: "error", summary: "Fallo en ejecución del agente", result: null, warnings: ["Excepción de red/modelo"], assumptions: [] };
           }
        });

        const agentResults = await Promise.all(agentPromises);

        // --- 5. SYNTHESIS (PROMPT ENGINEER AS ARTIFACT GENERATOR) ---
        sendEvent("status", { phase: "refining", agentStatuses: { "prompt-engineer": "working" } });

        let unificadoContext = `Contexto Original del Usuario:\n${prompt}\n\n--- Resultados JSON de la Colmena ---\n`;
        unificadoContext += JSON.stringify({ 
           request_id: currentSessionId || "temp_uuid",
           agent_outputs: agentResults 
        }, null, 2);

        const peAgent = dbAgents?.find(a => a.slug === "prompt-engineer");
        const basePePrompt = peAgent?.system_prompt || "Eres el Antigravity Prompt Engineer.";
        const finalSystemPrompt = `${basePePrompt}
CRÍTICO: No diseñas desde cero. Eres la Capa 4 de la Arquitectura (Synthesis & Artifact).
Tu trabajo es leer los JSON outputs del enjambre, **detectar y resolver cualquier contradicción cruzada** (ej: tablas llamadas distinto en backend vs frontend), y sintetizar la única verdad.
Salida obligatoria: UN ÚNICO archivo Markdown purificado. JAMÁS entregues conversación cruda, opiniones personales, o tu razonamiento JSON interno.
Tu salida final DEBE ser exclusivamente la plantilla respetando esta estructura:

# Contexto
[Párrafo introductorio]
# Objetivo
[Meta a lograr]
# Estado actual / Alcance funcional
# Modelo de datos propuesto
# Backend / API
# Frontend / UI
# Seguridad
# Fases de implementación
# Supuestos y Restricciones
# Instrucciones para Antigravity
# Resultado esperado`;

        const aiStream = await streamText({
          model: getActiveModel(),
          system: finalSystemPrompt,
          prompt: `Consolida y formatea este enjambre en el MD final:\n\n${unificadoContext}`,
        });

        let fullRefinedResponse = "";
        for await (const chunk of aiStream.textStream) {
          fullRefinedResponse += chunk;
          sendEvent("text", { chunk });
        }

        if (supabase && currentSessionId) {
           await supabase.from('messages').insert({ session_id: currentSessionId, role: 'refined', content: fullRefinedResponse, agent_slug: 'prompt-engineer' });
        }

        sendEvent("status", { phase: "done", agentStatuses: { "prompt-engineer": "completed" } });
        sendEvent("done", {});

      } catch (error: any) {
        console.error("Stream error in orchestrator:", error);
        sendEvent("error", { message: "Orchestration failed: " + (error.message || String(error)) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
