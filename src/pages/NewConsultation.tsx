import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import StepClientInfo from "@/components/consultation/StepClientInfo";
import StepFaceShape from "@/components/consultation/StepFaceShape";
import StepHairTexture from "@/components/consultation/StepHairTexture";
import StepLifestyle from "@/components/consultation/StepLifestyle";
import StepReview from "@/components/consultation/StepReview";
import { ConsultationFormData, INITIAL_FORM_DATA } from "@/components/consultation/types";

const FULL_STEPS = ["Client Info", "Face Shape", "Hair Texture", "Lifestyle", "Review"];
const QUICK_STEPS = ["Client Info", "Review"];

const NewConsultation = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<ConsultationFormData>(INITIAL_FORM_DATA);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isQuick = formData.serviceType === "quick_service";
  const steps = isQuick ? QUICK_STEPS : FULL_STEPS;
  const totalSteps = steps.length;
  const isReviewStep = currentStep === totalSteps - 1;

  const handleChange = useCallback(
    <K extends keyof ConsultationFormData>(key: K, value: ConsultationFormData[K]) => {
      setFormData((prev) => ({ ...prev, [key]: value }));
      // Reset step to 0 when service type changes so the user re-enters the flow
      if (key === "serviceType") setCurrentStep(0);
    },
    [],
  );

  const goToStep = (step: number) => {
    if (step >= 0 && step < totalSteps) setCurrentStep(step);
  };

  const canAdvance = () => {
    if (currentStep === 0 && !formData.clientName.trim()) return false;
    return true;
  };

  const handleNext = () => {
    if (!canAdvance()) {
      toast({ title: "Please fill in required fields", variant: "destructive" });
      return;
    }
    if (currentStep < totalSteps - 1) setCurrentStep((s) => s + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    if (!formData.clientName.trim()) {
      toast({ title: "Client name is required", variant: "destructive" });
      return;
    }
    if (formData.serviceType === "full_preview" && !formData.clientPhoto) {
      toast({ title: "Client photo is required for full consultations", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Not authenticated", variant: "destructive" });
      setLoading(false);
      return;
    }

    const { data: client, error: clientErr } = await supabase
      .from("clients")
      .insert({ stylist_id: user.id, full_name: formData.clientName.trim(), email: formData.clientEmail || null, phone: formData.clientPhone || null })
      .select("id")
      .single();

    if (clientErr || !client) {
      toast({ title: "Failed to create client", description: clientErr?.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    const { data: consultation, error: consultErr } = await supabase
      .from("consultations")
      .insert({
        stylist_id: user.id,
        client_id: client.id,
        service_type: formData.serviceType,
        hair_texture: formData.hairTexture || null,
        desired_length: formData.desiredLength || null,
        face_shape: formData.faceShape || null,
        maintenance_level: formData.maintenanceLevel || null,
        lifestyle: formData.lifestyle || null,
        inspiration_notes: formData.inspirationNotes || null,
        estimated_price: formData.estimatedPrice ? parseFloat(formData.estimatedPrice) : null,
        estimated_duration_minutes: formData.estimatedDuration ? parseInt(formData.estimatedDuration, 10) : null,
        appointment_date: formData.appointmentDate || null,
        status: "photo_uploaded",
      })
      .select("id")
      .single();

    if (consultErr || !consultation) {
      toast({ title: "Failed to create consultation", description: consultErr?.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    if (formData.clientPhoto) {
      const fileExt = formData.clientPhoto.name.split(".").pop() || "jpg";
      const filePath = `${user.id}/${consultation.id}/original.${fileExt}`;

      const { error: uploadErr } = await supabase.storage
        .from("consultation-images")
        .upload(filePath, formData.clientPhoto, { upsert: true });

      if (uploadErr) {
        toast({ title: "Failed to upload photo", description: uploadErr.message, variant: "destructive" });
        setLoading(false);
        return;
      }

      const { data: urlData } = await supabase.storage
        .from("consultation-images")
        .createSignedUrl(filePath, 60 * 60 * 24 * 365);

      const imageUrl = urlData?.signedUrl || filePath;
      await supabase.from("consultations").update({ original_image_url: imageUrl }).eq("id", consultation.id);
    }

    supabase.functions.invoke("generate-recommendation", { body: { consultation_id: consultation.id } }).catch(console.error);
    supabase.functions.invoke("generate-preview-image", { body: { consultation_id: consultation.id } }).catch(console.error);

    setLoading(false);
    navigate(`/client-view/${consultation.id}`);
  };

  const renderStep = () => {
    if (isQuick) {
      return currentStep === 0
        ? <StepClientInfo data={formData} onChange={handleChange} />
        : <StepReview data={formData} onChange={handleChange} onGoToStep={goToStep} fileInputRef={fileInputRef as React.RefObject<HTMLInputElement>} />;
    }

    switch (currentStep) {
      case 0: return <StepClientInfo data={formData} onChange={handleChange} />;
      case 1: return <StepFaceShape data={formData} onChange={handleChange} />;
      case 2: return <StepHairTexture data={formData} onChange={handleChange} />;
      case 3: return <StepLifestyle data={formData} onChange={handleChange} />;
      case 4: return <StepReview data={formData} onChange={handleChange} onGoToStep={goToStep} fileInputRef={fileInputRef as React.RefObject<HTMLInputElement>} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 md:px-12 py-4 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="font-display text-sm font-semibold tracking-[0.4em] uppercase text-foreground">
          AXIS HAIR™
        </span>
      </header>

      <div className="max-w-3xl mx-auto px-6 md:px-12 py-12">
        {/* Progress */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-[0.15em] uppercase text-foreground">
              New Consultation
            </h1>
            <span className="text-xs text-muted-foreground tracking-wide">
              Step {currentStep + 1} of {totalSteps}
            </span>
          </div>
          <Progress value={((currentStep + 1) / totalSteps) * 100} className="h-1" />
          <div className="flex justify-between mt-2">
            {steps.map((label, i) => (
              <button
                key={label}
                onClick={() => goToStep(i)}
                className={`text-[10px] tracking-[0.15em] uppercase transition-colors ${
                  i === currentStep ? "text-accent font-semibold" : "text-muted-foreground/60 hover:text-muted-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="min-h-[320px]">{renderStep()}</div>

        {/* Navigation */}
        <div className="pt-8 flex items-center gap-3">
          {currentStep > 0 && (
            <Button
              variant="outline"
              onClick={handleBack}
              className="tracking-[0.12em] uppercase text-xs h-12 px-8 border-border"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back
            </Button>
          )}

          {!isReviewStep ? (
            <Button
              onClick={handleNext}
              className="bg-accent text-accent-foreground hover:opacity-90 tracking-[0.18em] uppercase text-xs font-semibold h-12 px-8"
            >
              Next <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-accent text-accent-foreground hover:opacity-90 tracking-[0.18em] uppercase text-xs font-semibold h-12 px-8"
            >
              {loading ? "Creating..." : (
                <>
                  <Check className="h-3.5 w-3.5 mr-1" /> Generate Styles
                </>
              )}
            </Button>
          )}

          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="tracking-[0.12em] uppercase text-xs h-12 px-4 text-muted-foreground"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NewConsultation;
