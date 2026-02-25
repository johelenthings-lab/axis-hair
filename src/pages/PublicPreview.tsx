import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SwipeReveal from "@/components/SwipeReveal";

interface PreviewData {
  id: string;
  ai_recommendation: string | null;
  ai_generated_at: string | null;
  original_image_url: string | null;
  preview_image_url: string | null;
  clients: { full_name: string } | null;
}

const SECTION_HEADERS = [
  "STRUCTURE RECOMMENDATION:",
  "STYLING DIRECTION:",
  "MAINTENANCE PLAN:",
  "OPTIONAL UPGRADE:",
  "PROFESSIONAL JUSTIFICATION:",
];

const formatRecommendation = (text: string) => {
  const pattern = new RegExp(
    `(${SECTION_HEADERS.map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
    "g"
  );
  const parts = text.split(pattern).filter(Boolean);

  return parts.map((part, i) => {
    const isHeader = SECTION_HEADERS.some(
      (h) => part.trim().toUpperCase() === h || part.trim() === h
    );
    if (isHeader) {
      return (
        <h4
          key={i}
          className="font-display text-[13px] tracking-[0.2em] uppercase text-accent font-semibold mt-6 first:mt-0 mb-2"
        >
          {part.replace(/:$/, "")}
        </h4>
      );
    }
    return (
      <p key={i} className="text-sm text-foreground leading-relaxed whitespace-pre-line">
        {part.trim()}
      </p>
    );
  });
};

const PublicPreview = () => {
  const { consultationId } = useParams();
  const [data, setData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data: row, error } = await supabase
        .from("consultations")
        .select("id, ai_recommendation, ai_generated_at, original_image_url, preview_image_url, clients(full_name)")
        .eq("id", consultationId!)
        .maybeSingle();

      if (error || !row) {
        setNotFound(true);
      } else {
        setData(row as PreviewData);
      }
      setLoading(false);
    };
    fetch();
  }, [consultationId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="text-sm text-muted-foreground animate-pulse">Loading preview…</span>
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="text-sm text-muted-foreground">Consultation not found.</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-6 md:px-12 py-4">
        <span className="font-display text-sm font-semibold tracking-[0.4em] uppercase text-foreground">
          AXIS HAIR™
        </span>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 md:px-12 py-12">
        <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-[0.1em] uppercase text-foreground mb-2">
          {data.clients?.full_name ?? "Client"}
        </h1>
        <p className="text-xs tracking-[0.12em] uppercase text-muted-foreground mb-10">
          Style Consultation Preview
        </p>

        <div className="grid lg:grid-cols-2 gap-10">
          {/* Swipe Preview */}
          <div>
            <h2 className="font-display text-xs tracking-[0.25em] uppercase text-muted-foreground mb-5">
              Style Preview
            </h2>
            <SwipeReveal
              beforeUrl={data.original_image_url}
              afterUrl={data.preview_image_url ?? undefined}
              beforeLabel="Original"
              afterLabel="Preview"
            />
            <div className="mt-4 flex items-center gap-3 justify-center">
              <div className="h-px flex-1 bg-border" />
              <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
                Drag to compare
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>
          </div>

          {/* Recommendation */}
          <div>
            <h2 className="font-display text-xs tracking-[0.25em] uppercase text-muted-foreground mb-5">
              Professional Recommendation
            </h2>
            {data.ai_recommendation ? (
              <div className="border border-border rounded-sm p-6 bg-muted/30">
                <div>{formatRecommendation(data.ai_recommendation)}</div>
                {data.ai_generated_at && (
                  <p className="text-[10px] tracking-[0.12em] uppercase text-muted-foreground mt-6 pt-4 border-t border-border">
                    Generated{" "}
                    {new Date(data.ai_generated_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                )}
              </div>
            ) : (
              <div className="border border-border rounded-sm p-6 bg-muted/30">
                <p className="text-sm text-muted-foreground">
                  Recommendation is being prepared by your stylist.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-6 md:px-12 py-6 text-center">
        <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
          Prepared by your stylist using AXIS HAIR™
        </p>
      </footer>
    </div>
  );
};

export default PublicPreview;
