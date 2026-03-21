import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Sparkles, RefreshCw, Heart, Upload, ImageIcon, Globe, ChevronDown, ChevronUp, Edit3, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/i18n/LanguageContext";
import { validateImage } from "@/utils/imageValidation";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { logSystemEvent } from "@/utils/systemLogger";
import { invokeSafeAI } from "@/lib/ai-service";

interface LookData {
  id: string;
  look_number: number;
  style_label: string;
  style_description: string | null;
  image_url: string | null;
  generation_status: string;
  selected: boolean;
  audit_status?: string;
}

interface ConsultationInfo {
  id: string;
  original_image_url: string | null;
  clients: { full_name: string } | null;
  ai_recommendation: string | null;
  estimated_price: number | null;
  estimated_duration_minutes: number | null;
  appointment_date: string | null;
}

const ClientTryOn = () => {
  const { consultationId } = useParams();
  const [looks, setLooks] = useState<LookData[]>([]);
  const [consultation, setConsultation] = useState<ConsultationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selectedLook, setSelectedLook] = useState<number | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [uploadingAlt, setUploadingAlt] = useState(false);
  const [validatingAlt, setValidatingAlt] = useState(false);
  const [uploadedAltSrc, setUploadedAltSrc] = useState<string | null>(null);
  const altInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { t } = useLanguage();

  // NEW — Regenerate & Edit Answers states
  const [regenerating, setRegenerating] = useState(false);
  const [clientRegenUsed, setClientRegenUsed] = useState(false); // 1 regen per client per consultation
  const [editingAnswers, setEditingAnswers] = useState(false);
  const [savingAnswers, setSavingAnswers] = useState(false);
  const [hairTexture, setHairTexture] = useState("");
  const [desiredLength, setDesiredLength] = useState("");
  const [faceShape, setFaceShape] = useState("");
  const [maintenanceLevel, setMaintenanceLevel] = useState("");
  const [desiredStyle, setDesiredStyle] = useState("");

  // Fetch consultation + looks
  useEffect(() => {
    const fetchData = async () => {
      const { data: c, error: cErr } = await supabase
        .from("consultations")
        .select("*, clients(full_name)")
        .eq("id", consultationId!)
        .maybeSingle();

      if (cErr || !c) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setConsultation(c as unknown as ConsultationInfo);

      const { data: lookRows } = await supabase
        .from("consultation_looks")
        .select("*")
        .eq("consultation_id", consultationId!)
        .order("look_number");

      if (lookRows) {
        setLooks(lookRows as unknown as LookData[]);
        const selected = (lookRows as unknown as LookData[]).find((l) => l.selected);
        if (selected) {
          setSelectedLook(selected.look_number);
          setConfirmed(true);
        }
      }
      setLoading(false);
    };
    fetchData();
  }, [consultationId]);

  // Hydrate edit-answers fields & regen flag from loaded consultation
  useEffect(() => {
    if (!consultation) return;
    const c = consultation as any;
    setHairTexture(c.hair_texture || "");
    setDesiredLength(c.desired_length || "");
    setFaceShape(c.face_shape || "");
    setMaintenanceLevel(c.maintenance_level || "");
    setDesiredStyle(c.desired_style || "");
    // Restore regen-used flag from DB so page refresh doesn't grant a second regen
    if (c.client_regen_used) setClientRegenUsed(true);
  }, [consultation]);

  // Poll for generating looks
  useEffect(() => {
    const generating = looks.some((l) => l.generation_status === "generating");
    if (!generating) return;

    const interval = setInterval(async () => {
      const { data: lookRows } = await supabase
        .from("consultation_looks")
        .select("*")
        .eq("consultation_id", consultationId!)
        .order("look_number");

      if (lookRows) {
        setLooks(lookRows as unknown as LookData[]);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [looks, consultationId]);

  const handleConfirmSelection = async () => {
    if (!selectedLook) return;
    setConfirming(true);

    await supabase
      .from("consultation_looks")
      .update({ selected: false })
      .eq("consultation_id", consultationId!);

    await supabase
      .from("consultation_looks")
      .update({ selected: true })
      .eq("consultation_id", consultationId!)
      .eq("look_number", selectedLook);

    const selectedStyle = looks.find((l) => l.look_number === selectedLook);
    const clientName = consultation?.clients?.full_name ?? "A client";

    const { data: consRow } = await supabase
      .from("consultations")
      .select("stylist_id")
      .eq("id", consultationId!)
      .single();

    // Style selection notification removed to prevent excessive alerts


    setConfirmed(true);
    setConfirming(false);
  };

  // Regenerate all 3 looks — 1 per client per consultation, tracked in DB
  const handleRegenerate = async () => {
    if (clientRegenUsed) return; // Guard: already used

    setRegenerating(true);
    setConfirmed(false);
    setSelectedLook(null);
    setLooks(prev => prev.map(l => ({ ...l, generation_status: "generating" })));

    // Mark regen as used in DB immediately (prevents double-tap)
    const { data: consRow } = await supabase
      .from("consultations")
      .select("stylist_id")
      .eq("id", consultationId!)
      .single();

    await supabase
      .from("consultations")
      .update({ client_regen_used: true } as any)
      .eq("id", consultationId!);

    setClientRegenUsed(true);

    // Notify the stylist that the client used their regeneration
    const clientName = consultation?.clients?.full_name ?? "A client";
    // Client regen notification removed to prevent excessive alerts


    const trigger = () =>
      invokeSafeAI(
        "generate-try-on-looks",
        { consultation_id: consultationId!, look_number: 3, is_regeneration: true },
        { eventType: "ai_tryon", resourceId: consultationId!, maxRetries: 1 }
      );

    trigger();

    toast({ title: "✨ Generating refined look", description: "Your custom refinement is on the way — about 60 seconds." });
    setTimeout(() => setRegenerating(false), 30000);
  };

  // NEW — Save edited hair profile answers, then optionally regenerate
  const handleSaveAnswers = async (andRegenerate: boolean) => {
    setSavingAnswers(true);
    await supabase
      .from("consultations")
      .update({ hair_texture: hairTexture, desired_length: desiredLength, face_shape: faceShape, maintenance_level: maintenanceLevel, desired_style: desiredStyle })
      .eq("id", consultationId!);
    setSavingAnswers(false);
    setEditingAnswers(false);
    toast({ title: "✅ Answers updated" });
    if (andRegenerate) await handleRegenerate();
  };

  const handleAltPhotoUpload = async (file: File) => {
    const currentUploads = (consultation as any)?.inspiration_uploads_count ?? 0;
    if (currentUploads >= 2) {
      toast({ title: t('ai_flow_upload_limit_reached'), variant: "destructive" });
      return;
    }
    setUploadingAlt(true);
    const clientName = consultation?.clients?.full_name ?? "A client";

    const fileExt = file.name.split(".").pop() || "jpg";
    const filePath = `${consultationId}/alt-reference-${Date.now()}.${fileExt}`;

    const { error: uploadErr } = await supabase.storage
      .from("consultation-images")
      .upload(filePath, file, { upsert: true });

    if (uploadErr) {
      await logSystemEvent(
        'image_upload_error',
        'Alt photo storage upload failed',
        { error: uploadErr.message, filePath },
        'error',
        consultationId
      );
      setUploadingAlt(false);
      return;
    }

    await logSystemEvent(
      'image_upload_success',
      'Alt photo storage upload successful',
      { filePath },
      'info',
      consultationId
    );

    const { data: urlData } = await supabase.storage
      .from("consultation-images")
      .createSignedUrl(filePath, 60 * 60 * 24 * 365);

    const altImageUrl = urlData?.signedUrl || filePath;

    const { data: currentRes } = await supabase
      .from("consultations")
      .select("inspiration_notes, stylist_id")
      .eq("id", consultationId!)
      .single();

    const updatedNotes = (currentRes?.inspiration_notes ?? "") +
      `\n\n[CLIENT SUBMITTED MANUAL REFERENCE]: ${altImageUrl}`;

    const newUploadCount = currentUploads + 1;
    await supabase
      .from("consultations")
      .update({
        inspiration_notes: updatedNotes,
        status: "revision_requested",
        inspiration_uploads_count: newUploadCount,
        session_complete: newUploadCount >= 2
      })
      .eq("id", consultationId!);

    // Revision requested notification removed to prevent excessive alerts


    setUploadedAltSrc(altImageUrl);
    setConfirmed(true);
    setUploadingAlt(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="text-sm text-muted-foreground animate-pulse">{t('looks_arriving')}</span>
      </div>
    );
  }

  if (notFound || !consultation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="text-sm text-muted-foreground">{t('not_found')}</span>
      </div>
    );
  }

  const generationFinished = looks.length > 0 && looks.every((l) => l.generation_status === "done" || l.generation_status === "error");
  const anyGenerating = looks.some((l) => l.generation_status === "generating");
  const hasSuccessfulLooks = looks.some((l) => l.generation_status === "done");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border px-6 md:px-12 py-4 flex items-center justify-between">
        <span className="font-display text-sm font-semibold tracking-[0.4em] uppercase text-foreground">
          AXIS HAIR™
        </span>
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 md:px-12 py-10 md:py-16">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent/10 border border-accent/20 rounded-full mb-4">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            <span className="text-[10px] tracking-[0.15em] uppercase font-medium text-accent">
              {t('ai_tryon_looks')}
            </span>
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-[0.06em] text-foreground mb-4">
            {t('hi_name').replace('{name}', consultation.clients?.full_name ?? "there")}, {t('choose_look')}
          </h1>

          {/* 4-Step Indicator */}
          <div className="flex items-center justify-center gap-2 mb-8 max-w-lg mx-auto overflow-x-auto pb-2">
            {[1, 2, 3, 4].map((step) => {
                const isCompleted = step < (confirmed ? 4 : selectedLook ? 3 : 2);
                const isActive = step === (confirmed ? 4 : selectedLook ? 3 : 2);
                const stepLabels = [
                    t('step_upload_selfie') || "Step 1",
                    t('step_view_options') || "Step 2",
                    t('step_select_look') || "Step 3",
                    t('step_refine_upload') || "Step 4"
                ];
                return (
                    <div key={step} className="flex items-center gap-2 shrink-0">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border ${
                            isActive ? "bg-accent border-accent text-accent-foreground" : 
                            isCompleted ? "bg-accent/20 border-accent/40 text-accent" : 
                            "bg-muted border-border text-muted-foreground"
                        }`}>
                            {isCompleted ? <Check className="h-3 w-3" /> : step}
                        </div>
                        <span className={`text-[9px] uppercase tracking-wider whitespace-nowrap ${
                            isActive ? "text-foreground font-semibold" : "text-muted-foreground"
                        }`}>
                            {stepLabels[step-1]}
                        </span>
                        {step < 4 && <div className="w-4 h-[1px] bg-border mx-1" />}
                    </div>
                );
            })}
          </div>

          <p className="text-sm text-foreground/70 max-w-lg mx-auto">
            {t('tryon_sub')}
          </p>
          <p className="text-xs text-foreground/60 font-normal mt-4 italic">
            {t("gratitude_ai_gen")}
          </p>
        </motion.div>

        {/* Looks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 mb-8">
          {looks
            .filter(look => look.audit_status !== 'failed')
            .map((look, i) => (
              <motion.div
                key={look.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                {(look.generation_status === "generating" || (look.generation_status === "completed" && look.audit_status === "pending")) ? (
                  <div className="border border-border rounded-sm overflow-hidden bg-muted/10">
                    <div className="aspect-[3/4] flex flex-col items-center justify-center gap-4">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                      >
                        <RefreshCw className="h-6 w-6 text-accent" />
                      </motion.div>
                      <span className="text-xs uppercase text-muted-foreground tracking-[0.1em]">
                        {look.audit_status === "pending" && look.generation_status === "completed"
                          ? t('reviewing')
                          : `${t('look')} ${look.look_number}...`}
                      </span>
                    </div>
                  </div>
                ) : look.generation_status === "error" || !look.image_url ? (
                  <div className="border border-border rounded-sm overflow-hidden bg-muted/5">
                    <div className="aspect-[3/4] flex flex-col items-center justify-center gap-4 p-4 text-center">
                      <span className="text-xs uppercase text-muted-foreground tracking-[0.1em]">{t('error_gen_look')} {look.look_number}</span>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => !confirmed && setSelectedLook(look.look_number)}
                    disabled={confirmed}
                    className={`relative w-full text-left border rounded-sm overflow-hidden transition-all duration-300 ${selectedLook === look.look_number ? "border-accent" : "border-border"
                      } ${confirmed && selectedLook !== look.look_number ? "opacity-30" : ""}`}
                  >
                    <img src={look.image_url} className="w-full aspect-[3/4] object-cover" />
                    <div className="p-4 flex items-center justify-between">
                      <span className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground">{t('look')} {look.look_number}</span>
                      {selectedLook === look.look_number && <Check className="h-4 w-4 text-accent" />}
                    </div>
                  </button>
                )}
              </motion.div>
            ))}
        </div>

        {/* Progress Labels */}
        <div className="flex flex-wrap items-center justify-center gap-6 mb-10 pb-8 border-b border-border/50">
            <div className="flex flex-col items-center">
                <span className="text-[10px] tracking-widest uppercase text-muted-foreground mb-1">
                    {t('ai_looks_used_label').replace('{{used}}', String((consultation as any).ai_renders_count || 2)).replace('{{limit}}', '3')}
                </span>
                <div className="w-24 h-1 bg-muted rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-accent transition-all duration-500" 
                        style={{ width: `${((consultation as any).ai_renders_count || 2) / 3 * 100}%` }}
                    />
                </div>
            </div>
            <div className="flex flex-col items-center">
                <span className="text-[10px] tracking-widest uppercase text-muted-foreground mb-1">
                    {t('uploads_used_label').replace('{{used}}', String((consultation as any).inspiration_uploads_count || 0)).replace('{{limit}}', '2')}
                </span>
                <div className="w-24 h-1 bg-muted rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-accent transition-all duration-500" 
                        style={{ width: `${((consultation as any).inspiration_uploads_count || 0) / 2 * 100}%` }}
                    />
                </div>
            </div>
        </div>

        {/* ── ACTION ZONE ── always visible after generation */}
        {generationFinished && (
          <div className="space-y-10 mt-4">

            {/* 1 — Confirm a look (only when not yet confirmed) */}
            {!confirmed && hasSuccessfulLooks && (
              <div className="text-center pt-8 border-t border-border">
                <p className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-4">{t('option1_ai')}</p>
                <Button
                  onClick={handleConfirmSelection}
                  disabled={!selectedLook || confirming}
                  className="bg-accent text-accent-foreground h-12 px-10 uppercase text-xs tracking-[0.15em]"
                >
                  {confirming ? <Loader2 className="h-4 w-4 animate-spin" /> : t('this_is_one')}
                </Button>
              </div>
            )}

            {/* Confirmed state — shows which look was picked with option to change */}
            {confirmed && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center bg-accent/5 p-6 rounded-sm border border-accent/20"
              >
                {uploadedAltSrc ? (
                  <div className="mb-4 flex flex-col items-center">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">{t('you_uploaded')}</p>
                    <img src={uploadedAltSrc} alt="Your reference" className="w-24 h-24 object-cover rounded-md border-2 border-accent" />
                  </div>
                ) : (
                  <Heart className="h-7 w-7 text-accent mx-auto mb-3" />
                )}
                <h2 className="text-lg font-display font-bold uppercase tracking-widest mb-1">{t('selection_received')}</h2>
                <p className="text-sm text-muted-foreground mb-5">{t('all_set')}</p>
                <button
                  onClick={() => { setConfirmed(false); setSelectedLook(null); }}
                  className="text-[11px] tracking-[0.12em] uppercase text-muted-foreground/60 underline underline-offset-2 hover:text-foreground transition-colors"
                >
                  {t('change_selection')}
                </button>
              </motion.div>
            )}

            {/* 2 — Regenerate (Refinement) */}
            <div className="pt-8 border-t border-border space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-1">
                    {t('ai_flow_refinement_available')}
                  </p>
                  {!confirmed && (
                    <p className="text-[9px] text-accent font-medium">
                      * {t('ai_flow_select_to_refine')}
                    </p>
                  )}
                </div>
                <span className={`text-[9px] tracking-[0.1em] uppercase font-semibold px-2 py-0.5 rounded-full border ${(consultation as any).session_complete ? "border-muted text-muted-foreground/50 bg-muted/20" : "border-accent/30 text-accent bg-accent/5"}`}>
                  {(consultation as any).session_complete ? t('ai_flow_session_complete') : t('ai_flow_refinement_available')}
                </span>
              </div>
              <Button
                variant="outline"
                onClick={handleRegenerate}
                disabled={regenerating || anyGenerating || (consultation as any).session_complete || !confirmed}
                className={`w-full border border-accent/20 h-11 uppercase text-xs tracking-[0.12em] gap-2 ${(consultation as any).session_complete || !confirmed ? "opacity-30 cursor-not-allowed" : "hover:bg-accent/5"}`}
              >
                  {regenerating || anyGenerating ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> {t('regen_generating_looks')}</>
                  ) : (consultation as any).session_complete ? (
                    <><Check className="h-4 w-4" /> {t('ai_flow_refinement_used')}</>
                  ) : (
                    <><Sparkles className="h-4 w-4 text-accent" /> {t('regen_button')}</>
                  )}
              </Button>
            </div>


            {/* 3 — Upload your own inspiration photo */}
            <div className="pt-8 border-t border-border space-y-3">
              <p className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground text-center">
                {t('ai_flow_upload_limit_info')}
              </p>
              <div className="max-w-sm mx-auto">
                <input
                  ref={altInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      await logSystemEvent('image_upload_attempt', 'Alt file selected for validation', { consultationId, fileName: file.name, fileSize: file.size });
                      setValidatingAlt(true);
                      const result = await validateImage(file, t);
                      if (!result.valid) {
                        toast({ title: t("fail_upload"), description: result.error, variant: "destructive" });
                        e.target.value = "";
                      } else {
                        handleAltPhotoUpload(file);
                      }
                      setValidatingAlt(false);
                    }
                  }}
                />
                <Button
                  variant="outline"
                  onClick={() => !validatingAlt && altInputRef.current?.click()}
                  disabled={uploadingAlt || validatingAlt || (consultation as any).inspiration_uploads_count >= 2}
                  className="w-full border-dashed h-14 uppercase text-xs tracking-[0.1em] gap-2"
                >
                  {uploadingAlt || validatingAlt ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> {validatingAlt ? t("val_detecting") : t("val_loading")}</>
                  ) : (consultation as any).inspiration_uploads_count >= 2 ? (
                    <><Check className="h-4 w-4" /> {t('ai_flow_upload_limit_reached')}</>
                  ) : (
                    <><Upload className="h-4 w-4" /> {t('upload_inspiration_btn')}</>
                  )}
                </Button>
              </div>
            </div>

            {/* 4 — Edit my answers */}
            <div className="pt-8 border-t border-border space-y-3">
              <button
                onClick={() => setEditingAnswers(prev => !prev)}
                className="w-full flex items-center justify-between text-[10px] tracking-[0.15em] uppercase text-muted-foreground hover:text-foreground transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Edit3 className="h-3.5 w-3.5" />
                  {t('edit_answers_toggle')}
                </span>
                {editingAnswers ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              <AnimatePresence>
                {editingAnswers && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-muted/10 border border-border rounded-sm p-5 space-y-4 mt-3">
                      <p className="text-xs text-muted-foreground">{t('edit_answers_sub')}</p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase tracking-widest text-muted-foreground">{t('texture_label')}</label>
                          <select value={hairTexture} onChange={e => setHairTexture(e.target.value)} className="w-full text-sm bg-background border border-border rounded-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-accent">
                            <option value="">{t('select_texture')}</option>
                            <option value="straight">{t('texture_straight')}</option>
                            <option value="wavy">{t('texture_wavy')}</option>
                            <option value="curly">{t('texture_curly')}</option>
                            <option value="coily">{t('texture_coily')}</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase tracking-widest text-muted-foreground">{t('length_label')}</label>
                          <select value={desiredLength} onChange={e => setDesiredLength(e.target.value)} className="w-full text-sm bg-background border border-border rounded-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-accent">
                            <option value="">{t('select_length')}</option>
                            <option value="buzz">{t('length_buzz')}</option>
                            <option value="short">{t('length_short')}</option>
                            <option value="medium">{t('length_medium')}</option>
                            <option value="long">{t('length_long')}</option>
                            <option value="maintain">{t('length_maintain')}</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase tracking-widest text-muted-foreground">{t('shape_label')}</label>
                          <select value={faceShape} onChange={e => setFaceShape(e.target.value)} className="w-full text-sm bg-background border border-border rounded-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-accent">
                            <option value="">{t('select_shape')}</option>
                            <option value="oval">{t('shape_oval')}</option>
                            <option value="round">{t('shape_round')}</option>
                            <option value="square">{t('shape_square')}</option>
                            <option value="heart">{t('shape_heart')}</option>
                            <option value="oblong">{t('shape_oblong')}</option>
                            <option value="diamond">{t('shape_diamond')}</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase tracking-widest text-muted-foreground">{t('maint_label')}</label>
                          <select value={maintenanceLevel} onChange={e => setMaintenanceLevel(e.target.value)} className="w-full text-sm bg-background border border-border rounded-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-accent">
                            <option value="">{t('select_level')}</option>
                            <option value="low">{t('maint_low')}</option>
                            <option value="medium">{t('maint_medium')}</option>
                            <option value="high">{t('maint_high')}</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-widest text-muted-foreground">{t('style_notes_label')}</label>
                        <textarea
                          value={desiredStyle}
                          onChange={e => setDesiredStyle(e.target.value)}
                          rows={3}
                          placeholder={t('style_notes_placeholder')}
                          className="w-full text-sm bg-background border border-border rounded-sm px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-accent"
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <Button
                          onClick={() => handleSaveAnswers(false)}
                          disabled={savingAnswers}
                          variant="outline"
                          className="flex-1 text-xs uppercase tracking-widest h-11"
                        >
                          {savingAnswers ? <Loader2 className="h-4 w-4 animate-spin" /> : t('save_answers_only')}
                        </Button>
                        <Button
                          onClick={() => handleSaveAnswers(true)}
                          disabled={savingAnswers || regenerating}
                          className="flex-1 bg-accent text-accent-foreground text-xs uppercase tracking-widest h-11 gap-2"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          {t('save_and_regen')}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        )}
        {(consultation.ai_recommendation || consultation.estimated_price != null) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12 bg-accent/5 border border-accent/20 rounded-sm p-6 md:p-8 text-left"
          >
            <h2 className="font-display font-semibold uppercase tracking-widest text-lg mb-4">{t('rec_quote')}</h2>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-4">
                {consultation.ai_recommendation ? (
                  <div>
                    <h3 className="text-[10px] tracking-[0.2em] uppercase text-foreground/50 mb-2">{t('prof_advice')}</h3>
                    <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{consultation.ai_recommendation}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">{t('stylist_reviewing')}</p>
                )}
              </div>

              <div className="space-y-4 bg-background border border-border rounded-sm p-4">
                <div>
                  <h3 className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1">{t('est_cost')}</h3>
                  <p className="font-display text-xl font-bold">{consultation.estimated_price != null ? `$${consultation.estimated_price}` : t('pending')}</p>
                </div>
                {consultation.estimated_duration_minutes != null && (
                  <div>
                    <h3 className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1">{t('est_duration')}</h3>
                    <p className="text-sm font-medium">{consultation.estimated_duration_minutes} {t('minutes')}</p>
                  </div>
                )}
                {consultation.appointment_date && (
                  <div>
                    <h3 className="text-[10px] tracking-[0.2em] uppercase text-foreground/50 mb-1">{t('scheduled_date')}</h3>
                    <p className="text-sm font-medium text-foreground/90">{new Date(consultation.appointment_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {confirmed && (
          <motion.div className="text-center bg-accent/5 p-8 md:p-12 rounded-sm border border-accent/20">
            {uploadedAltSrc ? (
              <div className="mb-6 flex flex-col items-center">
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">{t('you_uploaded')}</p>
                <img src={uploadedAltSrc} alt="Your reference" className="w-32 h-32 object-cover rounded-md border-2 border-accent" />
              </div>
            ) : (
              <Heart className="h-8 w-8 text-accent mx-auto mb-4" />
            )}
            <h2 className="text-xl font-display font-bold uppercase tracking-widest mb-2">{t('selection_received')}</h2>
            <p className="text-sm text-muted-foreground">{t('all_set')}</p>
          </motion.div>
        )}

        {anyGenerating && (
          <p className="text-center text-xs text-muted-foreground animate-pulse mt-8 uppercase tracking-widest">
            {t('looks_arriving')}
          </p>
        )}
      </main>

      <footer className="border-t border-border py-8 text-center mt-auto">
        <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">AXIS HAIR™</p>
      </footer>
    </div>
  );
};

export default ClientTryOn;
