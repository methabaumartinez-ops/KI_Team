// =============================================================================
// AgentIA-Automate — POST /api/orchestrator
// =============================================================================
// The central orchestration endpoint.
// Uses Server-Sent Events (SSE) to stream both state updates (agent status)
// and the final text generation from the Antigravity Refinement Agent.
// =============================================================================

import { NextRequest } from "next/server";
import { streamText } from "ai";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { AGENT_DEFINITIONS } from "@/lib/antigravity/agent-registry";
import { generateAgentResponse, getActiveModel } from "@/lib/ai/provider";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const { prompt } = await req.json();

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
      // Helper to push SSE events
      const sendEvent = (event: string, data: any) => {
        const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(payload));
      };

      try {
        // 1. Initial State: Dispatching
        sendEvent("status", { phase: "dispatching" });

        // Simulate a tiny delay for visual pacing
        await new Promise((r) => setTimeout(r, 600));

        // 2. Select Agents (Simulated routing for now: pick Mobile & Database)
        const candidates = AGENT_DEFINITIONS.filter(a => a.slug !== "prompt-engineer");
        const pickedAgents = candidates.slice(0, 2); 
        
        const initialStatus: Record<string, string> = {};
        pickedAgents.forEach((a) => {
          initialStatus[a.slug] = "working";
        });
        
        sendEvent("status", { phase: "receiving", agentStatuses: initialStatus });

        // Fetch Agent definitions from DB to get the system prompts (fallback safely if not configured)
        let dbAgents: any[] | null = null;
        try {
          if (supabase) {
            const { data } = await supabase.from("agents").select("*");
            dbAgents = data;
          }
        } catch (dbError) {
          console.warn("Supabase DB not accessible, falling back to static agent registry.");
        }

        // 3. Execute picked agents in parallel
        const agentPromises = pickedAgents.map(async (agentDef) => {
          const dbAgent = dbAgents?.find((a) => a.slug === agentDef.slug);

          // Ideally, we create a Task here using our DB schema. 
          // For brevity in the edge stream, we just call the AI provider directly.
          try {
            const result = await generateAgentResponse({
              systemPrompt: dbAgent?.system_prompt || agentDef.defaultSystemPrompt,
              userPrompt: `The user asked: ${prompt}\nAnalyze this relative to your expertise.`,
              maxTokens: 500,
            });
            
            // Send completed event for this specific agent
            sendEvent("status", { 
              agentStatuses: { [agentDef.slug]: "completed" } 
            });
            
            return { slug: agentDef.slug, text: result.text };
          } catch (error) {
            sendEvent("status", { 
              agentStatuses: { [agentDef.slug]: "failed" } 
            });
            return { slug: agentDef.slug, error: "Execution failed" };
          }
        });

        const agentResults = await Promise.all(agentPromises);

        // 4. Final Refinement Stage (Antigravity Prompt Engineer)
        sendEvent("status", { 
          phase: "refining", 
          agentStatuses: { "prompt-engineer": "working" } 
        });

        // Get the prompt engineer's system prompt from DB or fallback
        const peAgent = dbAgents?.find(a => a.slug === "prompt-engineer");
        const pePrompt = peAgent?.system_prompt || "You are the Antigravity Prompt Engineer. Synthesize everything.";
        const finalSystemPrompt = `${pePrompt}\n\nCRITICAL INSTRUCTION: You MUST detect the language of the User Prompt. You MUST write your entire final response in the exact same language the user has written in (e.g. if the user writes in Spanish, reply in Spanish; if English, reply in English). NEVER default strictly to German unless the user inputs German.`;

        // Build the combined context from earlier agents
        let context = `User Prompt: ${prompt}\n\n`;
        context += `--- Agent Insights ---\n`;
        agentResults.forEach(res => {
          if (res.text) context += `[${res.slug}]: ${res.text}\n\n`;
        });

        // Insert User Message to DB
        let sessionId: string | undefined;
        let userMessageId: string | undefined;
        if (supabase) {
           try {
              const { data: sessData, error: sessErr } = await supabase.from('sessions').insert({ title: prompt.substring(0, 50) }).select('id').single();
              if (sessData) sessionId = sessData.id;
              
              if (sessionId) {
                  const { data: msgData } = await supabase.from('messages').insert({
                     session_id: sessionId,
                     role: 'user',
                     content: prompt,
                  }).select('id').single();
                  if (msgData) userMessageId = msgData.id;
              }
           } catch (e) {
              console.warn("DB Session creation failed gently.", e);
           }
        }

        // Stream the refinement response
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

        // Log final AI response to DB
        if (supabase && sessionId) {
           try {
              await supabase.from('messages').insert({
                 session_id: sessionId,
                 role: 'refined',
                 content: fullRefinedResponse,
                 agent_slug: 'prompt-engineer'
              });
           } catch (e) {
              console.warn("Failed to log AI response to DB.", e);
           }
        }

        // 5. Done
        sendEvent("status", { 
          phase: "done", 
          agentStatuses: { "prompt-engineer": "completed" } 
        });
        sendEvent("done", {});

      } catch (error) {
        console.error("Stream error in orchestrator:", error);
        sendEvent("error", { message: "Orchestration failed" });
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
