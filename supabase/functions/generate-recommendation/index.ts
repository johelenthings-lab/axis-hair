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

    // Fetch consultation data
    const { data: consultation, error: fetchErr } = await supabase
      .from("consultations")
      .select("hair_texture, desired_length, face_shape, maintenance_level, lifestyle, inspiration_notes")
      .eq("id", consultation_id)
      .single();

    if (fetchErr || !consultation) {
      throw new Error(`Failed to fetch consultation: ${fetchErr?.message}`);
    }

    const val = (v: string | null) => v || "Not specified";

    const prompt = `You are a senior professional stylist working inside a premium consultation platform.

Based on the following client intake data:

Hair Texture: ${val(consultation.hair_texture)}
Desired Length: ${val(consultation.desired_length)}
Face Shape: ${val(consultation.face_shape)}
Maintenance Level: ${val(consultation.maintenance_level)}
Lifestyle: ${val(consultation.lifestyle)}
Inspiration Notes: ${val(consultation.inspiration_notes)}

Provide a structured professional recommendation using this format:

STRUCTURE RECOMMENDATION:
(Concise cut structure and shape)

STYLING DIRECTION:
(Overall aesthetic direction)

MAINTENANCE PLAN:
(Upkeep frequency and effort)

OPTIONAL UPGRADE:
(Professional add-on service suggestion)

PROFESSIONAL JUSTIFICATION:
(Why this works for their face shape and texture)

Tone must be confident, professional, and salon-ready.
Avoid fluff. Avoid emojis. Avoid casual language.`;

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

    // Save to database
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
Update the generate-recommendation edge function to improve variation behavior.

Inside the existing prompt string, modify it so that:

If ai_recommendation already exists for this consultation, append the following instruction to the prompt:

"Provide a distinctly different structural and aesthetic approach than any previous recommendation for this consultation. Do not repeat structure, direction, or phrasing."

Implementation requirements:

Before building the prompt, fetch ai_recommendation from the consultation record.

If ai_recommendation is not null:

Add a boolean flag isRegeneration = true

When building the prompt:

If isRegeneration is true, append the variation instruction at the end of the prompt.

Do not modify the frontend.

Do not change response format.

Keep TypeScript clean.

Preserve existing DB update logic.
Refine the tone of the AI recommendation to feel relational and stylist-client centered instead of editorial.

Update the main prompt instructions as follows:

The recommendation should be written in first-person stylist voice.

Address the client directly using "you".

Make it feel conversational, collaborative, and exciting — like a stylist speaking to their client before their appointment.

Keep the same structured sections internally:

Structure

Styling Direction

Maintenance Plan

Optional Upgrade

Professional Justification

However, do NOT label sections in all caps inside the narrative.

Instead, naturally transition between ideas using stylist language such as:

"When you come in..."

"Here’s what I’m thinking..."

"I’d love to try..."

"This will really complement..."

"To keep it looking fresh..."

Keep tone confident and professional.

Avoid fluff.

Avoid emojis.

Avoid overly corporate language.

The result should feel warm, personalized, and anticipatory while still structured and high-level.

Do not modify database logic.
Do not modify response format storage.
Only adjust tone and section formatting.  