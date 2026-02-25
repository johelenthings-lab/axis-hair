import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Link2, Check, X, CalendarIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import SwipeReveal from "@/components/SwipeReveal";
import AIRecommendation from "@/components/AIRecommendation";
import { generateConsultationPdf } from "@/lib/generateConsultationPdf";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
  preview_image_url: string | null;
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
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceInput, setPriceInput] = useState("");
  const [priceConfirm, setPriceConfirm] = useState(false);
  const [editingDate, setEditingDate] = useState(false);
  const [dateConfirm, setDateConfirm] = useState(false);

  const handleRecommendationUpdate = (recommendation: string, generatedAt: string) => {
    setData((prev) => prev ? { ...prev, ai_recommendation: recommendation, ai_generated_at: generatedAt } : prev);
  };

  const handleDownloadPdf = async () => {
    if (!data) return;
    setGeneratingPdf(true);
    try {
      await generateConsultationPdf({
        clientName: data.clients?.full_name ?? "Client",
        hairTexture: display(data.hair_texture),
        desiredLength: display(data.desired_length),
        faceShape: display(data.face_shape),
        maintenanceLevel: display(data.maintenance_level),
        lifestyle: display(data.lifestyle),
        estimatedPrice: data.estimated_price != null ? `$${data.estimated_price}` : "—",
        recommendation: data.ai_recommendation,
        generatedAt: data.ai_generated_at,
        originalImageUrl: data.original_image_url,
        previewImageUrl: data.preview_image_url,
      });
    } catch {
      toast({ title: "Failed to generate PDF", variant: "destructive" });
    } finally {
      setGeneratingPdf(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const { data: row } = await supabase
        .from("consultations")
        .select("id, hair_texture, desired_length, face_shape, maintenance_level, lifestyle, inspiration_notes, status, estimated_price, appointment_date, original_image_url, preview_image_url, ai_recommendation, ai_generated_at, clients(full_name)")
        .eq("id", id!)
        .single();
      setData(row as ConsultationData | null);
      setLoading(false);
    };
    fetchData();
  }, [id]);

  const updateStatus = async (status: string) => {
    setUpdating(true);
    const { error } = await supabase.from("consultations").update({ status }).eq("id", id!);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    } else {
      const messages: Record<string, string> = {
        approved: "Look approved!",
        revision_requested: "Adjustment requested",
        cancelled: "Appointment cancelled",
        awaiting_approval: "Appointment restored",
      };
      toast({ title: messages[status] ?? "Status updated" });
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

            {/* AI Recommendation */}
            <div className="mt-8">
              <h2 className="font-display text-xs tracking-[0.25em] uppercase text-muted-foreground mb-5">
                Professional Recommendation
              </h2>
              <AIRecommendation
                consultationId={data.id}
                initialRecommendation={data.ai_recommendation}
                initialGeneratedAt={data.ai_generated_at}
                onUpdate={handleRecommendationUpdate}
              />
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
                <div className="flex justify-between items-center min-h-[32px]">
                  <span className="text-xs tracking-[0.12em] uppercase text-muted-foreground">Estimated Cost</span>
                  {data.status === "cancelled" ? (
                    <span className="text-xs text-muted-foreground/50 italic">Restore appointment to modify pricing.</span>
                  ) : editingPrice ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">$</span>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={priceInput}
                        onChange={(e) => setPriceInput(e.target.value)}
                        onBlur={() => {
                          if (priceInput) setPriceInput(parseFloat(priceInput).toFixed(2));
                        }}
                        className="w-24 h-8 text-sm bg-background border-border"
                        placeholder="0.00"
                        autoFocus
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-foreground"
                        onClick={async () => {
                          const newPrice = priceInput ? parseFloat(priceInput) : null;
                          const { error } = await supabase
                            .from("consultations")
                            .update({ estimated_price: newPrice })
                            .eq("id", id!);
                          if (error) {
                            toast({ title: "Update failed", description: error.message, variant: "destructive" });
                          } else {
                            setData((prev) => prev ? { ...prev, estimated_price: newPrice } : prev);
                            setPriceConfirm(true);
                            setTimeout(() => setPriceConfirm(false), 2500);
                          }
                          setEditingPrice(false);
                        }}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground"
                        onClick={() => setEditingPrice(false)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {priceConfirm && (
                        <span className="text-[10px] tracking-[0.1em] uppercase text-muted-foreground animate-in fade-in">
                          Price updated.
                        </span>
                      )}
                      <span className="text-sm text-foreground">
                        {data.estimated_price != null ? `$${data.estimated_price}` : "—"}
                      </span>
                      <button
                        className="text-[10px] tracking-[0.1em] uppercase text-muted-foreground/60 hover:text-muted-foreground underline underline-offset-2 bg-transparent border-none cursor-pointer transition-colors"
                        onClick={() => {
                          setPriceInput(data.estimated_price != null ? String(data.estimated_price) : "");
                          setEditingPrice(true);
                        }}
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-center min-h-[32px]">
                  <span className="text-xs tracking-[0.12em] uppercase text-muted-foreground">Appointment</span>
                  {data.status === "cancelled" ? (
                    <span className="text-xs text-muted-foreground/50 italic">Restore appointment to modify date.</span>
                  ) : editingDate ? (
                    <div className="flex items-center gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "h-8 w-[160px] justify-start text-left text-sm border-border",
                              !data.appointment_date && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                            {data.appointment_date
                              ? format(new Date(data.appointment_date), "MMM d, yyyy")
                              : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                          <Calendar
                            mode="single"
                            selected={data.appointment_date ? new Date(data.appointment_date) : undefined}
                            onSelect={async (date) => {
                              const isoDate = date ? date.toISOString() : null;
                              const { error } = await supabase
                                .from("consultations")
                                .update({ appointment_date: isoDate })
                                .eq("id", id!);
                              if (error) {
                                toast({ title: "Update failed", description: error.message, variant: "destructive" });
                              } else {
                                setData((prev) => prev ? { ...prev, appointment_date: isoDate } : prev);
                                setDateConfirm(true);
                                setTimeout(() => setDateConfirm(false), 2500);
                              }
                              setEditingDate(false);
                            }}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground"
                        onClick={() => setEditingDate(false)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {dateConfirm && (
                        <span className="text-[10px] tracking-[0.1em] uppercase text-muted-foreground animate-in fade-in">
                          Date updated.
                        </span>
                      )}
                      <span className="text-sm text-foreground">
                        {data.appointment_date ? format(new Date(data.appointment_date), "MMM d, yyyy") : "—"}
                      </span>
                      <button
                        className="text-[10px] tracking-[0.1em] uppercase text-muted-foreground/60 hover:text-muted-foreground underline underline-offset-2 bg-transparent border-none cursor-pointer transition-colors"
                        onClick={() => setEditingDate(true)}
                      >
                        Edit
                      </button>
                    </div>
                  )}
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

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleDownloadPdf}
                  disabled={generatingPdf}
                  className="flex-1 tracking-[0.12em] uppercase text-xs h-12 border-border"
                >
                  <Download className="h-3.5 w-3.5 mr-2" />
                  {generatingPdf ? "Generating PDF…" : "Download PDF"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const url = `${window.location.origin}/preview/${data.id}`;
                    navigator.clipboard.writeText(url);
                    toast({ title: "Share link copied to clipboard" });
                  }}
                  className="flex-1 tracking-[0.12em] uppercase text-xs h-12 border-border"
                >
                  <Link2 className="h-3.5 w-3.5 mr-2" />
                  Copy Share Link
                </Button>
              </div>

              {data.status !== "cancelled" && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full tracking-[0.12em] uppercase text-xs h-12 border-destructive/30 text-destructive/80 hover:bg-destructive/5 hover:text-destructive"
                    >
                      Cancel Appointment
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure you want to cancel this appointment?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will mark the consultation as cancelled. The record will be preserved but excluded from active metrics.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="tracking-[0.1em] uppercase text-xs">Keep Appointment</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => updateStatus("cancelled")}
                        className="bg-destructive/80 text-destructive-foreground hover:bg-destructive tracking-[0.1em] uppercase text-xs"
                      >
                        Confirm Cancel
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              {data.status === "cancelled" && (
                <div className="space-y-3">
                  <p className="text-center text-xs tracking-[0.12em] uppercase text-destructive/60 py-2">
                    This appointment has been cancelled
                  </p>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        disabled={updating}
                        className="w-full tracking-[0.12em] uppercase text-xs h-12 border-border"
                      >
                        Restore Appointment
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Restore this appointment?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will move the consultation back to active status and include it in your metrics.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="tracking-[0.1em] uppercase text-xs">Keep Cancelled</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => updateStatus("awaiting_approval")}
                          className="tracking-[0.1em] uppercase text-xs"
                        >
                          Restore
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientView;
