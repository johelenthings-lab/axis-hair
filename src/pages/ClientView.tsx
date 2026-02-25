import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ConsultationData {
  id: string;
  hair_texture: string | null;
  desired_length: string | null;
  face_shape: string | null;
  maintenance_level: string | null;
  lifestyle: string | null;
  inspiration_notes: string | null;
  status: string;
  estimated_price: number | null;
  appointment_date: string | null;
  original_image_url: string | null;
  ai_recommendation: string | null;
  ai_generated_at: string | null;
  clients: { full_name: string } | null;
}

const labelMap: Record<string, string> = {
  straight: "Straight (Type 1)", wavy: "Wavy (Type 2)", curly: "Curly (Type 3)", coily: "Coily (Type 4)",
  buzz: "Buzz / Close Crop", short: "Short", medium: "Medium", long: "Long", maintain: "Maintain Current",
  oval: "Oval", round: "Round", square: "Square", heart: "Heart", oblong: "Oblong", diamond: "Diamond",
  low: "Low — Minimal Styling", high: "High — Daily Styling",
  professional: "Professional / Corporate", creative: "Creative / Artistic", active: "Active / Athletic", casual: "Casual / Relaxed",
};

const ClientView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [data, setData] = useState<ConsultationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const regenerateRecommendation = async () => {
    setRegenerating(true);
    const { error } = await supabase.functions.invoke("generate-recommendation", {
      body: { consultation_id: id },
    });
    if (error) {
      toast({ title: "Failed to regenerate recommendation", variant: "destructive" });
    } else {
      const { data: updated } = await supabase
        .from("consultations")
        .select("ai_recommendation, ai_generated_at")
        .eq("id", id!)
        .single();
      if (updated) {
        setData((prev) => prev ? { ...prev, ...updated } : prev);
      }
    }
    setRegenerating(false);
  };

  useEffect(() => {
    const fetchData = async () => {
      const { data: row } = await supabase
        .from("consultations")
        .select("id, hair_texture, desired_length, face_shape, maintenance_level, lifestyle, inspiration_notes, status, estimated_price, appointment_date, original_image_url, ai_recommendation, ai_generated_at, clients(full_name)")
        .eq("id", id!)
        .single();
      setData(row as ConsultationData | null);
      setLoading(false);
      return row as ConsultationData | null;
    };
    fetchData().then((row) => {
      // Poll for AI recommendation if not yet generated
      if (row && !row.ai_recommendation) {
        const interval = setInterval(async () => {
          const { data: updated } = await supabase
            .from("consultations")
            .select("ai_recommendation, ai_generated_at")
            .eq("id", id!)
            .single();
          if (updated?.ai_recommendation) {
            setData((prev) => prev ? { ...prev, ...updated } : prev);
            clearInterval(interval);
          }
        }, 3000);
        // Stop polling after 60s
        setTimeout(() => clearInterval(interval), 60000);
      }
    });
  }, [id]);

  const updateStatus = async (status: string) => {
    setUpdating(true);
    const { error } = await supabase.from("consultations").update({ status }).eq("id", id!);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: status === "approved" ? "Look approved!" : "Adjustment requested" });
      navigate("/dashboard");
    }
    setUpdating(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="text-sm text-muted-foreground animate-pulse">Loading...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="text-sm text-muted-foreground">Consultation not found.</span>
      </div>
    );
  }

  const display = (val: string | null) => (val ? labelMap[val] ?? val : "—");

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 md:px-12 py-4 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="font-display text-sm font-semibold tracking-[0.4em] uppercase text-foreground">
          AXIS HAIR™
        </span>
        <span className="text-xs tracking-[0.12em] uppercase text-muted-foreground ml-auto">
          {data.clients?.full_name ?? "Client"}
        </span>
      </header>

      <div className="max-w-5xl mx-auto px-6 md:px-12 py-12">
        <div className="grid lg:grid-cols-2 gap-10">
          {/* Preview Area */}
          <div>
            <h2 className="font-display text-xs tracking-[0.25em] uppercase text-muted-foreground mb-5">
              Style Preview
            </h2>
            {data.original_image_url ? (
              <div className="aspect-[3/4] rounded-sm overflow-hidden border border-border">
                <img
                  src={data.original_image_url}
                  alt={`${data.clients?.full_name ?? "Client"} photo`}
                  className="w-full h-full object-cover object-top"
                />
              </div>
            ) : (
              <div className="aspect-[3/4] bg-muted rounded-sm flex items-center justify-center border border-border">
                <div className="text-center">
                  <div className="w-32 h-32 rounded-full bg-border mx-auto mb-4" />
                  <p className="text-xs tracking-[0.12em] uppercase text-muted-foreground">
                    No photo uploaded
                  </p>
                </div>
              </div>
            )}
            <div className="mt-4 flex items-center gap-3 justify-center">
              <div className="h-px flex-1 bg-border" />
              <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
                Drag to compare
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* AI Recommendation */}
            <div className="mt-8">
              <h2 className="font-display text-xs tracking-[0.25em] uppercase text-muted-foreground mb-5">
                Professional Recommendation
              </h2>
              {data.ai_recommendation ? (
                <div className="border border-border rounded-sm p-6 bg-muted/30">
                  <div className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                    {data.ai_recommendation}
                  </div>
                  {data.ai_generated_at && (
                    <p className="text-[10px] tracking-[0.12em] uppercase text-muted-foreground mt-4">
                      Generated {new Date(data.ai_generated_at).toLocaleDateString()}
                    </p>
                  )}
                  <Button
                    onClick={regenerateRecommendation}
                    disabled={regenerating}
                    className="mt-4 h-10 tracking-[0.12em] uppercase text-xs font-semibold"
                  >
                    {regenerating && <Loader2 className="h-3 w-3 animate-spin" />}
                    {regenerating ? "Regenerating..." : "Regenerate Recommendation"}
                  </Button>
                </div>
              ) : (
                <div className="border border-border rounded-sm p-6 bg-muted/30">
                  <div className="flex items-center gap-3">
                    {!regenerating && <div className="h-3 w-3 rounded-full bg-accent animate-pulse" />}
                    <span className="text-sm text-muted-foreground">
                      {regenerating ? "Generating recommendation…" : "No recommendation yet."}
                    </span>
                  </div>
                  <Button
                    onClick={regenerateRecommendation}
                    disabled={regenerating}
                    className="mt-4 h-10 tracking-[0.12em] uppercase text-xs font-semibold"
                  >
                    {regenerating && <Loader2 className="h-3 w-3 animate-spin" />}
                    {regenerating ? "Generating..." : "Generate Recommendation"}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <div>
            <h2 className="font-display text-xs tracking-[0.25em] uppercase text-muted-foreground mb-5">
              Consultation Details
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="font-display text-2xl font-semibold tracking-[0.1em] uppercase text-foreground">
                  {data.clients?.full_name ?? "Client"}
                </h3>
                {data.inspiration_notes && (
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    {data.inspiration_notes}
                  </p>
                )}
              </div>

              <div className="h-px bg-border" />

              <div className="space-y-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs tracking-[0.12em] uppercase text-muted-foreground">Hair Texture</span>
                  <span className="text-sm text-foreground">{display(data.hair_texture)}</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-xs tracking-[0.12em] uppercase text-muted-foreground">Desired Length</span>
                  <span className="text-sm text-foreground">{display(data.desired_length)}</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-xs tracking-[0.12em] uppercase text-muted-foreground">Face Shape</span>
                  <span className="text-sm text-foreground">{display(data.face_shape)}</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-xs tracking-[0.12em] uppercase text-muted-foreground">Maintenance Level</span>
                  <span className="text-sm text-foreground">{display(data.maintenance_level)}</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-xs tracking-[0.12em] uppercase text-muted-foreground">Lifestyle</span>
                  <span className="text-sm text-foreground">{display(data.lifestyle)}</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-xs tracking-[0.12em] uppercase text-muted-foreground">Estimated Cost</span>
                  <span className="text-sm text-foreground">
                    {data.estimated_price != null ? `$${data.estimated_price}` : "—"}
                  </span>
                </div>
              </div>

              <div className="h-px bg-border" />

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => updateStatus("approved")}
                  disabled={updating || data.status === "approved"}
                  className="flex-1 bg-accent text-accent-foreground hover:opacity-90 tracking-[0.18em] uppercase text-xs font-semibold h-12"
                >
                  {data.status === "approved" ? "Approved" : "Approve This Look"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => updateStatus("revision_requested")}
                  disabled={updating}
                  className="flex-1 tracking-[0.12em] uppercase text-xs h-12 border-border"
                >
                  Request Adjustment
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientView;
