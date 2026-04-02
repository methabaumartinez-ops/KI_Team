import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.from("agents").select("slug, system_prompt");

    if (error) {
      console.error("Agent Fetch Error:", error);
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    console.error("Agent Fetch API Error:", error);
    return NextResponse.json({ success: false, message: error.message || "Unknown Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { slug, system_prompt, name, description } = await req.json();

    if (!slug || !system_prompt) {
      return NextResponse.json({ success: false, message: "Missing slug or system_prompt" }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();

    // Upsert explicitly to either update the existing slug or insert missing ones.
    const { data, error } = await supabase
      .from("agents")
      .upsert({
        slug,
        system_prompt,
        // Optional fallbacks if table strictly requires name
        ...(name && { name }),
        ...(description && { description }),
        updated_at: new Date().toISOString()
      }, { onConflict: "slug" })
      .select()
      .single();

    if (error) {
      console.error("Agent Config Save Error:", error);
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    console.error("Agent Config POST Error:", error);
    return NextResponse.json({ success: false, message: error.message || "Unknown Error" }, { status: 500 });
  }
}
