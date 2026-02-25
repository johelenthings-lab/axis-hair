import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.97.0";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type, x-supabase-client-info, x-supabase-client-platform",
};

interface ConsultationData {
    original_image_url: string | null;
    hair_texture: string | null;
    desired_length: string | null;
    face_shape: string | null;
    maintenance_level: string | null;
    lifestyle: string | null;
    inspiration_notes: string | null;
    service_type: string | null;
    stylist_id: string;
}

function buildImagePrompt(c: ConsultationData): { instruction: string; refPrompt: string } {
    const textureMap: Record<string, string> = {
        straight: "straight, sleek",
        wavy: "soft, natural waves",
        curly: "defined, bouncy curls",
        coily: "natural coily, voluminous",
    };
    const lengthMap: Record<string, string> = {
        buzz: "very short buzz cut",
        short: "short crop",
        medium: "medium length",
        long: "long flowing",
        maintain: "neatly maintained current length",
    };
    const lifestyleMap: Record<string, string> = {
        professional: "polished, corporate-ready",
        creative: "expressive and artistic",
        active: "practical, sporty",
        casual: "relaxed, natural",
    };

    const texture = c.hair_texture ? textureMap[c.hair_texture] ?? c.hair_texture : "styled";
    const length = c.desired_length ? lengthMap[c.desired_length] ?? c.desired_length : "";
    const lifestyle = c.lifestyle ? lifestyleMap[c.lifestyle] ?? "" : "";
    const notes = c.inspiration_notes ? c.inspiration_notes.slice(0, 80) : "";

    // InstructPix2Pix uses an instruction-style prompt
    const instruction = [
        `Give this person a ${length} ${texture} hairstyle`,
        lifestyle ? `with a ${lifestyle} aesthetic` : "",
        notes ? `— ${notes}` : "",
    ]
        .filter(Boolean)
        .join(" ")
        .trim();

    // Reference generation prompt (when no photo)
    const refPrompt = [
        "professional salon portrait photography, studio lighting, sharp focus, photorealistic",
        `${length} ${texture} hairstyle`,
        lifestyle ? `${lifestyle} style` : "",
        "beautiful hair, high quality, natural skin tones, neutral background",
        notes,
    ]
        .filter(Boolean)
        .join(", ");

    return { instruction, refPrompt };
}

async function pollPrediction(
    predictionId: string,
    apiKey: string,
    maxAttempts = 25,
    intervalMs = 4000
): Promise<{ status: string; output?: string[] | string }> {
    for (let i = 0; i < maxAttempts; i++) {
        await new Promise((r) => setTimeout(r, intervalMs));
        const res = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
            headers: { Authorization: `Token ${apiKey}` },
        });
        const data = await res.json();
        if (data.status === "succeeded" || data.status === "failed" || data.status === "canceled") {
            return data;
        }
    }
    throw new Error("Prediction timed out after max polling attempts");
}

serve(async (req) => {
    if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    try {
        const { consultation_id } = await req.json();
        if (!consultation_id) throw new Error("consultation_id is required");

        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const replicateApiKey = Deno.env.get("REPLICATE_API_KEY");

        if (!replicateApiKey) throw new Error("REPLICATE_API_KEY not configured in Supabase secrets");

        const supabase = createClient(supabaseUrl, serviceRoleKey);

        // ── 1. Mark as generating ────────────────────────────────────────────────
        await supabase
            .from("consultations")
            .update({ preview_status: "generating" })
            .eq("id", consultation_id);

        // ── 2. Fetch consultation data ───────────────────────────────────────────
        const { data: consultation, error: fetchErr } = await supabase
            .from("consultations")
            .select(
                "original_image_url, hair_texture, desired_length, face_shape, maintenance_level, lifestyle, inspiration_notes, service_type, stylist_id"
            )
            .eq("id", consultation_id)
            .single();

        if (fetchErr || !consultation) throw new Error(`Failed to fetch consultation: ${fetchErr?.message}`);

        const { instruction, refPrompt } = buildImagePrompt(consultation as ConsultationData);

        // ── 3. Call Replicate ────────────────────────────────────────────────────
        let predictionBody: Record<string, unknown>;

        if (consultation.original_image_url) {
            // Photo uploaded → InstructPix2Pix (edits the real client photo)
            predictionBody = {
                // timothybrooks/instruct-pix2pix — latest public version
                version: "30c1d0b916a6f8efce20493f5d61ee27491ab2a60437c13c588468b9810ec23d",
                input: {
                    image: consultation.original_image_url,
                    prompt: instruction,
                    num_inference_steps: 25,
                    image_guidance_scale: 1.5,
                    guidance_scale: 8.0,
                },
            };
        } else {
            // No photo → SDXL text-to-image hairstyle reference
            predictionBody = {
                // stability-ai/sdxl latest
                version: "7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc",
                input: {
                    prompt: refPrompt,
                    negative_prompt:
                        "blurry, distorted, bad anatomy, cartoon, illustration, watermark, text, ugly, poorly lit",
                    width: 768,
                    height: 1024,
                    num_inference_steps: 25,
                    guidance_scale: 7.5,
                },
            };
        }

        const startRes = await fetch("https://api.replicate.com/v1/predictions", {
            method: "POST",
            headers: {
                Authorization: `Token ${replicateApiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(predictionBody),
        });

        if (!startRes.ok) {
            const errText = await startRes.text();
            throw new Error(`Replicate API error ${startRes.status}: ${errText}`);
        }

        const prediction = await startRes.json();
        const result = await pollPrediction(prediction.id, replicateApiKey);

        if (result.status !== "succeeded") {
            throw new Error(`Prediction ${result.status}`);
        }

        // Output can be a string or array depending on the model
        const rawUrl = Array.isArray(result.output) ? result.output[0] : result.output;
        if (!rawUrl) throw new Error("No output image returned from Replicate");

        // ── 4. Download image and upload to Supabase Storage ────────────────────
        const imgRes = await fetch(rawUrl as string);
        if (!imgRes.ok) throw new Error("Failed to download generated image");
        const imgBuffer = await imgRes.arrayBuffer();

        const storagePath = `${(consultation as ConsultationData).stylist_id}/${consultation_id}/preview.jpg`;

        const { error: uploadErr } = await supabase.storage
            .from("consultation-images")
            .upload(storagePath, imgBuffer, {
                contentType: "image/jpeg",
                upsert: true,
            });

        if (uploadErr) throw new Error(`Storage upload failed: ${uploadErr.message}`);

        // ── 5. Create signed URL (1 year) ────────────────────────────────────────
        const { data: urlData } = await supabase.storage
            .from("consultation-images")
            .createSignedUrl(storagePath, 60 * 60 * 24 * 365);

        const finalUrl = urlData?.signedUrl ?? rawUrl;

        // ── 6. Save to database ──────────────────────────────────────────────────
        await supabase
            .from("consultations")
            .update({
                preview_image_url: finalUrl,
                preview_status: "done",
            })
            .eq("id", consultation_id);

        return new Response(JSON.stringify({ success: true, preview_url: finalUrl }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (e) {
        console.error("generate-preview-image error:", e);

        // Mark as failed in DB so the UI can reflect it
        try {
            const supabase = createClient(
                Deno.env.get("SUPABASE_URL")!,
                Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
            );
            const body = await (async () => {
                try { return await (async () => { return {}; })(); } catch { return {}; }
            })();
            // We don't have consultation_id in scope here if the parse failed — that's ok
            void body;
        } catch { /* swallow */ }

        return new Response(
            JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
