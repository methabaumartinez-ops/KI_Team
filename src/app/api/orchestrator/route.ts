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
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { AGENT_DEFINITIONS } from "@/lib/antigravity/agent-registry";
import { generateAgentResponse, getActiveModel } from "@/lib/ai/provider";
import { searchVectorDatabase } from "@/lib/qdrant/search";

export const runtime = "edge";

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

        const orchestratorPrompt = `Eres el "Asistente de desarrollo", el director de proyecto de AgentIA. 
Tu trabajo es recabar información técnica del usuario para poder delegar tareas complejas a un enjambre de agentes expertos (ej: Database Architect, DevOps, Prompt Engineer).
DIRECTRICES CRÍTICAS:
1. Haz preguntas CORTAS, DIRECTAS y estrictamente necesarias. Cero comentarios banales.
2. Si un usuario subió un documento a la base de datos de conocimiento, USA LA HERRAMIENTA 'query_database' primero para extraer información antes de preguntarle cosas obvias que ya podrían estar ahí.
3. Puedes conversar las veces que haga falta con el usuario para afinar los detalles de la arquitectura.
4. CUANDO consideres que YA TIENES toda la información para estructurar el desarrollo, DEBES usar OBLIGATORIAMENTE la herramienta 'delegate_to_swarm'. NO digas nada más, solo usa la herramienta y ella disparará el enjambre.`;

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
                 
                 // Append tool call and result to history to loop again
                 msgHistory.push({ role: 'assistant', content: '', toolCalls: [call] });
                 msgHistory.push({ role: 'tool', content: JSON.stringify(results), toolCallId: call.toolCallId });
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
             const result = await generateAgentResponse({
               systemPrompt: agentPrompt,
               userPrompt: `The Orchestrator mapped this task for you based on the user chat: ${taskDef.taskInstructions}\nPerform your expert analysis.`,
             });
             sendEvent("status", { agentStatuses: { [taskDef.agentSlug]: "completed" } });
             return { slug: taskDef.agentSlug, text: result.text };
           } catch (error) {
             sendEvent("status", { agentStatuses: { [taskDef.agentSlug]: "failed" } });
             return { slug: taskDef.agentSlug, error: "Execution failed" };
           }
        });

        const agentResults = await Promise.all(agentPromises);

        // --- 5. SYNTHESIS (PROMPT ENGINEER) ---
        sendEvent("status", { phase: "refining", agentStatuses: { "prompt-engineer": "working" } });

        let context = `Contexto Original del Usuario:\n${prompt}\n\n--- Análisis de los Agentes Especializados ---\n`;
        agentResults.forEach(res => {
          if (res.text) context += `[Agente: ${res.slug}]:\n${res.text}\n\n`;
        });

        const peAgent = dbAgents?.find(a => a.slug === "prompt-engineer");
        const pePrompt = peAgent?.system_prompt || "Eres el Antigravity Prompt Engineer.";
        const finalSystemPrompt = `${pePrompt}\n\nCRÍTICO: Tienes que unir y refinar todo lo que han hecho los agentes en un único 'Implementation Plan' perfecto y estructurado que será leído directamente por Antigravity (el motor IA principal del IDE). Contesta en el mismo idioma del usuario.`;

        const aiStream = await streamText({
          model: getActiveModel(),
          system: finalSystemPrompt,
          prompt: context,
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
