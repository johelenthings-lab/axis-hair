import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.97.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { consultation_id } = await req.json();
    if (!consultation_id) throw new Error("consultation_id is required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: consultation, error: fetchErr } = await supabase
      .from("consultations")
      .select("hair_texture, desired_length, face_shape, maintenance_level, lifestyle, inspiration_notes, service_type, ai_recommendation")
      .eq("id", consultation_id)
      .single();

    if (fetchErr || !consultation) {
      throw new Error(`Failed to fetch consultation: ${fetchErr?.message}`);
    }

    const isRegeneration = consultation.ai_recommendation != null;
    const val = (v: string | null) => v || "Not specified";

    const introTone = consultation.service_type === "quick_service"
      ? `You are a highly trusted personal stylist speaking to your returning client.
This is a maintenance visit, not a transformation.
Write the recommendation in a warm, supportive tone focused on refinement, polish, and upkeep.
Open with something like:
"When you come in, we'll refine what you already love about your current look..."`
      : `You are a highly trusted personal stylist preparing for a transformation consultation.
Write the recommendation in first-person voice with excitement and anticipation.
Open with something like:
"When you come in, here's what I'd love to try..."`;

    let prompt = `${introTone}

Based on the following client intake data:

Hair Texture: ${val(consultation.hair_texture)}
Desired Length: ${val(consultation.desired_length)}
Face Shape: ${val(consultation.face_shape)}
Maintenance Level: ${val(consultation.maintenance_level)}
Lifestyle: ${val(consultation.lifestyle)}
Inspiration Notes: ${val(consultation.inspiration_notes)}

Address the client as "you."

Blend structure naturally into conversation without uppercase section headers.

Cover:
• Structure and cut direction
• Styling approach
• Maintenance plan
• Optional upgrade suggestion (if appropriate)
• Professional reasoning

Keep tone polished, warm, and relational.
Avoid emojis.
Avoid editorial language.`;

    if (isRegeneration) {
      prompt += `\n\nProvide a distinctly different structural and aesthetic approach than any previous recommendation for this consultation. Do not repeat structure, direction, or phrasing.`;
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: prompt }],
        stream: false,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      throw new Error(`AI gateway returned ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const recommendation = aiData.choices?.[0]?.message?.content;

    if (!recommendation) throw new Error("No recommendation content in AI response");

    const { error: updateErr } = await supabase
      .from("consultations")
      .update({
        ai_recommendation: recommendation,
        ai_generated_at: new Date().toISOString(),
      })
      .eq("id", consultation_id);

    if (updateErr) throw new Error(`Failed to save recommendation: ${updateErr.message}`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-recommendation error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
