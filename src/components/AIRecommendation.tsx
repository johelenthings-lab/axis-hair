import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AIRecommendationProps {
  consultationId: string;
  initialRecommendation: string | null;
  initialGeneratedAt: string | null;
  onUpdate: (recommendation: string, generatedAt: string) => void;
}

type Status = "idle" | "generating" | "done" | "error";

const AIRecommendation = ({
  consultationId,
  initialRecommendation,
  initialGeneratedAt,
  onUpdate,
}: AIRecommendationProps) => {
  const { toast } = useToast();
  const [recommendation, setRecommendation] = useState(initialRecommendation);
  const [generatedAt, setGeneratedAt] = useState(initialGeneratedAt);
  const [status, setStatus] = useState<Status>(
    initialRecommendation ? "done" : "idle"
  );
  const autoTriggered = useRef(false);

  // Sync props when parent updates
  useEffect(() => {
    if (initialRecommendation) {
      setRecommendation(initialRecommendation);
      setGeneratedAt(initialGeneratedAt);
      setStatus("done");
    }
  }, [initialRecommendation, initialGeneratedAt]);

  // Auto-trigger generation once if no recommendation exists
  useEffect(() => {
    if (!initialRecommendation && !autoTriggered.current) {
      autoTriggered.current = true;
      generate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generate = async () => {
    setStatus("generating");

    const { error } = await supabase.functions.invoke(
      "generate-recommendation",
      { body: { consultation_id: consultationId } }
    );

    if (error) {
      setStatus("error");
      toast({
        title: "Failed to generate recommendation",
        variant: "destructive",
      });
      return;
    }

    // Poll for result (edge function may be async)
    let attempts = 0;
    const poll = setInterval(async () => {
      attempts++;
      const { data } = await supabase
        .from("consultations")
        .select("ai_recommendation, ai_generated_at")
        .eq("id", consultationId)
        .single();

      if (data?.ai_recommendation) {
        clearInterval(poll);
        setRecommendation(data.ai_recommendation);
        setGeneratedAt(data.ai_generated_at);
        setStatus("done");
        onUpdate(data.ai_recommendation, data.ai_generated_at!);
      } else if (attempts >= 20) {
        clearInterval(poll);
        // Check one final time
        const { data: final } = await supabase
          .from("consultations")
          .select("ai_recommendation, ai_generated_at")
          .eq("id", consultationId)
          .single();

        if (final?.ai_recommendation) {
          setRecommendation(final.ai_recommendation);
          setGeneratedAt(final.ai_generated_at);
          setStatus("done");
          onUpdate(final.ai_recommendation, final.ai_generated_at!);
        } else {
          setStatus("error");
        }
      }
    }, 3000);
  };

  if (status === "generating") {
    return (
      <div className="border border-border rounded-sm p-8 bg-muted/30">
        <div className="flex flex-col items-center text-center gap-4 py-4">
          {/* Subtle animated bars */}
          <div className="flex items-end gap-1 h-6">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-[3px] rounded-full bg-foreground/30"
                style={{
                  animation: `pulse 1.4s ease-in-out ${i * 0.15}s infinite`,
                  height: `${12 + (i % 3) * 6}px`,
                }}
              />
            ))}
          </div>
          <div>
            <p className="font-display text-sm tracking-[0.15em] uppercase text-foreground font-semibold">
              Analyzing profile…
            </p>
            <p className="text-xs text-muted-foreground mt-1.5 tracking-wide">
              Generating professional structure and styling recommendation.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="border border-border rounded-sm p-8 bg-muted/30">
        <div className="flex flex-col items-center text-center gap-4 py-2">
          <p className="font-display text-sm tracking-[0.15em] uppercase text-foreground font-semibold">
            Recommendation could not be generated.
          </p>
          <Button
            onClick={generate}
            className="h-10 tracking-[0.12em] uppercase text-xs font-semibold"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (status === "done" && recommendation) {
    return (
      <div className="border border-border rounded-sm p-6 bg-muted/30">
        <div className="text-sm text-foreground leading-relaxed whitespace-pre-line">
          {recommendation}
        </div>
        {generatedAt && (
          <p className="text-[10px] tracking-[0.12em] uppercase text-muted-foreground mt-4">
            Generated {new Date(generatedAt).toLocaleDateString()}
          </p>
        )}
        <Button
          onClick={generate}
          disabled={status !== "done"}
          className="mt-4 h-10 tracking-[0.12em] uppercase text-xs font-semibold"
        >
          Regenerate Recommendation
        </Button>
      </div>
    );
  }

  // Fallback idle state (shouldn't normally show due to auto-trigger)
  return (
    <div className="border border-border rounded-sm p-6 bg-muted/30">
      <div className="flex items-center gap-3">
        <div className="h-3 w-3 rounded-full bg-accent animate-pulse" />
        <span className="text-sm text-muted-foreground">
          No recommendation yet.
        </span>
      </div>
      <Button
        onClick={generate}
        className="mt-4 h-10 tracking-[0.12em] uppercase text-xs font-semibold"
      >
        Generate Recommendation
      </Button>
    </div>
  );
};

export default AIRecommendation;
