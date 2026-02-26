import { useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, ImageIcon, Pencil, X } from "lucide-react";
import type { ConsultationFormData, StepProps } from "./types";
import { useLanguage } from "@/i18n/LanguageContext";

interface StepReviewProps extends StepProps {
  onGoToStep: (step: number) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

const displayValue = (val: string | undefined | null, fallback = "Not set") =>
  val ? val.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : fallback;

const Section = ({
  title,
  stepIndex,
  onEdit,
  editLabel,
  children,
}: {
  title: string;
  stepIndex: number;
  onEdit: (step: number) => void;
  editLabel: string;
  children: React.ReactNode;
}) => (
  <div className="border border-border rounded-sm p-5">
    <div className="flex items-center justify-between mb-3">
      <h3 className="font-display text-xs tracking-[0.2em] uppercase text-muted-foreground">{title}</h3>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onEdit(stepIndex)}
        className="text-xs text-accent hover:text-accent/80 gap-1 h-7 px-2"
      >
        <Pencil className="h-3 w-3" /> {editLabel}
      </Button>
    </div>
    {children}
  </div>
);

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between text-sm py-1">
    <span className="text-muted-foreground">{label}</span>
    <span className="text-foreground font-medium">{value}</span>
  </div>
);

const StepReview = ({ data, onChange, onGoToStep, fileInputRef }: StepReviewProps) => {
  const isFullPreview = data.serviceType === "full_preview";
  const { t } = useLanguage();
  const photoPreviewUrl = useMemo(
    () => (data.clientPhoto ? URL.createObjectURL(data.clientPhoto) : null),
    [data.clientPhoto],
  );

  const editLabel = t("edit");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xs tracking-[0.25em] uppercase text-muted-foreground mb-2">
          {t("review_confirm")}
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          {t("review_confirm")}
        </p>
      </div>

      <div className="space-y-4">
        {/* Client Info */}
        <Section title="Client Information" stepIndex={0} onEdit={onGoToStep} editLabel={editLabel}>
          <Row label="Name" value={data.clientName || "—"} />
          <Row label="Email" value={data.clientEmail || "—"} />
          <Row label="Phone" value={data.clientPhone || "—"} />
          <Row label="Service" value={displayValue(data.serviceType)} />
        </Section>

        {/* Face Shape */}
        {isFullPreview && (
          <Section title="Face Shape" stepIndex={1} onEdit={onGoToStep} editLabel={editLabel}>
            <Row label="Face Shape" value={displayValue(data.faceShape)} />
          </Section>
        )}

        {/* Hair Texture */}
        {isFullPreview && (
          <Section title="Hair Texture & Length" stepIndex={2} onEdit={onGoToStep} editLabel={editLabel}>
            <Row label="Hair Texture" value={displayValue(data.hairTexture)} />
            <Row label="Desired Length" value={displayValue(data.desiredLength)} />
          </Section>
        )}

        {/* Lifestyle */}
        {isFullPreview && (
          <Section title="Lifestyle & Maintenance" stepIndex={3} onEdit={onGoToStep} editLabel={editLabel}>
            <Row label="Maintenance" value={displayValue(data.maintenanceLevel)} />
            <Row label="Lifestyle" value={displayValue(data.lifestyle)} />
            {data.inspirationNotes && <Row label="Notes" value={data.inspirationNotes} />}
          </Section>
        )}

        {/* Appointment Details */}
        <div className="border border-border rounded-sm p-5">
          <h3 className="font-display text-xs tracking-[0.2em] uppercase text-muted-foreground mb-4">
            Appointment Details
          </h3>
          <div className="grid md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-xs tracking-[0.12em] uppercase text-muted-foreground">Appointment Date</Label>
              <Input type="datetime-local" value={data.appointmentDate} onChange={(e) => onChange("appointmentDate", e.target.value)} className="bg-background border-border" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs tracking-[0.12em] uppercase text-muted-foreground">Estimated Price ($)</Label>
              <Input type="number" min="0" step="0.01" value={data.estimatedPrice} onChange={(e) => onChange("estimatedPrice", e.target.value)} className="bg-background border-border" placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs tracking-[0.12em] uppercase text-muted-foreground">Duration (min)</Label>
              <Input type="number" min="0" step="5" value={data.estimatedDuration} onChange={(e) => onChange("estimatedDuration", e.target.value)} className="bg-background border-border" placeholder="e.g. 60" />
            </div>
          </div>
        </div>

        {/* Photo Upload */}
        <div className="border border-border rounded-sm p-5">
          <h3 className="font-display text-xs tracking-[0.2em] uppercase text-muted-foreground mb-4">
            Photo Upload <span className="normal-case text-muted-foreground/60">(optional)</span>
          </h3>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png"
            className="hidden"
            onChange={(e) => {
              try {
                const file = e.target.files?.[0] || null;
                onChange("clientPhoto", file);
              } catch (err) {
                console.error("Error selecting file:", err);
              }
            }}
          />
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border border-dashed rounded-sm p-6 text-center transition-colors cursor-pointer ${
              data.clientPhoto ? "border-accent/50 bg-accent/5" : "border-border hover:border-foreground/30"
            }`}
          >
            {data.clientPhoto && photoPreviewUrl ? (
              <div className="flex items-center gap-4 text-left">
                <img
                  src={photoPreviewUrl}
                  alt="Client preview"
                  className="h-20 w-20 rounded-sm object-cover border border-border shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{data.clientPhoto.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {(data.clientPhoto.size / 1024).toFixed(0)} KB
                  </p>
                  <p className="text-xs text-accent mt-1 hover:underline">Click to change</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange("clientPhoto", null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="shrink-0 p-1.5 rounded-sm border border-border text-muted-foreground hover:text-destructive hover:border-destructive/50 transition-colors"
                  aria-label="Remove photo"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <Upload className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-medium text-foreground">
                  Upload Client Photo
                </p>
                <p className="text-xs text-muted-foreground mt-1">JPG or PNG</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepReview;
