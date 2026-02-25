import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Upload, ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const NewConsultation = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Client fields
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");

  // Consultation fields
  const [hairTexture, setHairTexture] = useState("");
  const [desiredLength, setDesiredLength] = useState("");
  const [faceShape, setFaceShape] = useState("");
  const [maintenanceLevel, setMaintenanceLevel] = useState("");
  const [lifestyle, setLifestyle] = useState("");
  const [inspirationNotes, setInspirationNotes] = useState("");
  const [estimatedPrice, setEstimatedPrice] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [serviceType, setServiceType] = useState("quick_service");
  const [clientPhoto, setClientPhoto] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!clientName.trim()) {
      toast({ title: "Client name is required", variant: "destructive" });
      return;
    }
    if (serviceType === "full_preview" && !clientPhoto) {
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

    // Create client
    const { data: client, error: clientErr } = await supabase
      .from("clients")
      .insert({ stylist_id: user.id, full_name: clientName.trim(), email: clientEmail || null, phone: clientPhone || null })
      .select("id")
      .single();

    if (clientErr || !client) {
      toast({ title: "Failed to create client", description: clientErr?.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    // Create consultation
    const { data: consultation, error: consultErr } = await supabase
      .from("consultations")
      .insert({
        stylist_id: user.id,
        client_id: client.id,
        service_type: serviceType,
        hair_texture: hairTexture || null,
        desired_length: desiredLength || null,
        face_shape: faceShape || null,
        maintenance_level: maintenanceLevel || null,
        lifestyle: lifestyle || null,
        inspiration_notes: inspirationNotes || null,
        estimated_price: estimatedPrice ? parseFloat(estimatedPrice) : null,
        appointment_date: appointmentDate || null,
        status: "photo_uploaded",
      })
      .select("id")
      .single();

    if (consultErr || !consultation) {
      toast({ title: "Failed to create consultation", description: consultErr?.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    // Upload client photo to storage (if provided)
    if (clientPhoto) {
      const fileExt = clientPhoto.name.split(".").pop() || "jpg";
      const filePath = `${user.id}/${consultation.id}/original.${fileExt}`;

      const { error: uploadErr } = await supabase.storage
        .from("consultation-images")
        .upload(filePath, clientPhoto, { upsert: true });

      if (uploadErr) {
        toast({ title: "Failed to upload photo", description: uploadErr.message, variant: "destructive" });
        setLoading(false);
        return;
      }

      // Get signed URL (private bucket)
      const { data: urlData } = await supabase.storage
        .from("consultation-images")
        .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 year

      // Update consultation with image URL
      const imageUrl = urlData?.signedUrl || filePath;
      await supabase
        .from("consultations")
        .update({ original_image_url: imageUrl })
        .eq("id", consultation.id);
    }

    // Fire-and-forget AI recommendation generation
    supabase.functions.invoke("generate-recommendation", {
      body: { consultation_id: consultation.id },
    }).catch((err) => console.error("AI recommendation error:", err));

    setLoading(false);
    navigate(`/client-view/${consultation.id}`);
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
        <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-[0.15em] uppercase text-foreground mb-2">
          New Consultation
        </h1>
        <p className="text-sm text-muted-foreground mb-10">
          Complete the intake form to generate an AI-powered style preview.
        </p>

        <div className="space-y-8">
          {/* Service Type */}
          <div>
            <h2 className="font-display text-xs tracking-[0.25em] uppercase text-muted-foreground mb-5">
              Service Type
            </h2>
            <div className="space-y-2">
              <Label className="text-xs tracking-[0.12em] uppercase text-muted-foreground">Service Type *</Label>
              <Select value={serviceType} onValueChange={setServiceType}>
                <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="quick_service">Quick Maintenance / Trim</SelectItem>
                  <SelectItem value="full_preview">Full Style Consultation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Client Info */}
          <div>
            <h2 className="font-display text-xs tracking-[0.25em] uppercase text-muted-foreground mb-5">
              Client Information
            </h2>
            <div className="grid md:grid-cols-3 gap-5">
              <div className="space-y-2">
                <Label className="text-xs tracking-[0.12em] uppercase text-muted-foreground">Client Name *</Label>
                <Input value={clientName} onChange={(e) => setClientName(e.target.value)} className="bg-background border-border" placeholder="Full name" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs tracking-[0.12em] uppercase text-muted-foreground">Email <span className="normal-case text-muted-foreground/60">(optional)</span></Label>
                <Input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} className="bg-background border-border" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs tracking-[0.12em] uppercase text-muted-foreground">Phone <span className="normal-case text-muted-foreground/60">(optional)</span></Label>
                <Input type="tel" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} className="bg-background border-border" />
              </div>
            </div>
          </div>

          {/* Hair Profile — full_preview only */}
          {serviceType === "full_preview" && (
            <div>
              <h2 className="font-display text-xs tracking-[0.25em] uppercase text-muted-foreground mb-5">
                Hair Profile
              </h2>
              <div className="grid md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-xs tracking-[0.12em] uppercase text-muted-foreground">Hair Texture</Label>
                  <Select value={hairTexture} onValueChange={setHairTexture}>
                    <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Select texture" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="straight">Straight (Type 1)</SelectItem>
                      <SelectItem value="wavy">Wavy (Type 2)</SelectItem>
                      <SelectItem value="curly">Curly (Type 3)</SelectItem>
                      <SelectItem value="coily">Coily (Type 4)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs tracking-[0.12em] uppercase text-muted-foreground">Desired Length</Label>
                  <Select value={desiredLength} onValueChange={setDesiredLength}>
                    <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Select length" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buzz">Buzz / Close Crop</SelectItem>
                      <SelectItem value="short">Short</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="long">Long</SelectItem>
                      <SelectItem value="maintain">Maintain Current</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs tracking-[0.12em] uppercase text-muted-foreground">Face Shape</Label>
                  <Select value={faceShape} onValueChange={setFaceShape}>
                    <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Select shape" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="oval">Oval</SelectItem>
                      <SelectItem value="round">Round</SelectItem>
                      <SelectItem value="square">Square</SelectItem>
                      <SelectItem value="heart">Heart</SelectItem>
                      <SelectItem value="oblong">Oblong</SelectItem>
                      <SelectItem value="diamond">Diamond</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs tracking-[0.12em] uppercase text-muted-foreground">Maintenance Level</Label>
                  <Select value={maintenanceLevel} onValueChange={setMaintenanceLevel}>
                    <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Select level" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low — Minimal Styling</SelectItem>
                      <SelectItem value="medium">Medium — Some Effort</SelectItem>
                      <SelectItem value="high">High — Daily Styling</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Lifestyle — full_preview only */}
          {serviceType === "full_preview" && (
            <div>
              <h2 className="font-display text-xs tracking-[0.25em] uppercase text-muted-foreground mb-5">
                Lifestyle & Preferences
              </h2>
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-xs tracking-[0.12em] uppercase text-muted-foreground">Lifestyle</Label>
                  <Select value={lifestyle} onValueChange={setLifestyle}>
                    <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Select lifestyle" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional / Corporate</SelectItem>
                      <SelectItem value="creative">Creative / Artistic</SelectItem>
                      <SelectItem value="active">Active / Athletic</SelectItem>
                      <SelectItem value="casual">Casual / Relaxed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs tracking-[0.12em] uppercase text-muted-foreground">
                    Inspiration Notes <span className="normal-case text-muted-foreground/60">(optional)</span>
                  </Label>
                  <Textarea
                    value={inspirationNotes}
                    onChange={(e) => setInspirationNotes(e.target.value)}
                    placeholder="Describe the look the client is going for, any references, or special considerations..."
                    className="bg-background border-border min-h-[100px] resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Maintenance Notes — quick_service only */}
          {serviceType === "quick_service" && (
            <div>
              <h2 className="font-display text-xs tracking-[0.25em] uppercase text-muted-foreground mb-5">
                Notes
              </h2>
              <div className="space-y-2">
                <Label className="text-xs tracking-[0.12em] uppercase text-muted-foreground">
                  Maintenance Notes <span className="normal-case text-muted-foreground/60">(optional)</span>
                </Label>
                <Textarea
                  value={inspirationNotes}
                  onChange={(e) => setInspirationNotes(e.target.value)}
                  placeholder="Any notes about this maintenance appointment..."
                  className="bg-background border-border min-h-[80px] resize-none"
                />
              </div>
            </div>
          )}

          {/* Appointment & Pricing */}
          <div>
            <h2 className="font-display text-xs tracking-[0.25em] uppercase text-muted-foreground mb-5">
              Appointment Details
            </h2>
            <div className="grid md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-xs tracking-[0.12em] uppercase text-muted-foreground">Appointment Date</Label>
                <Input type="datetime-local" value={appointmentDate} onChange={(e) => setAppointmentDate(e.target.value)} className="bg-background border-border" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs tracking-[0.12em] uppercase text-muted-foreground">Estimated Price ($) <span className="normal-case text-muted-foreground/60">(optional)</span></Label>
                <Input type="number" min="0" step="0.01" value={estimatedPrice} onChange={(e) => setEstimatedPrice(e.target.value)} className="bg-background border-border" placeholder="0.00" />
                <p className="text-xs text-muted-foreground/60">Enter your expected service total for this appointment. This will be used for revenue tracking.</p>
              </div>
            </div>
          </div>

          {/* Photo Upload */}
          <div>
            <h2 className="font-display text-xs tracking-[0.25em] uppercase text-muted-foreground mb-5">
              Photo Upload {serviceType === "quick_service" && <span className="normal-case text-muted-foreground/60">(optional)</span>}
            </h2>
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setClientPhoto(file);
                }}
              />
              {serviceType === "quick_service" ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border border-dashed rounded-sm p-4 text-center transition-colors cursor-pointer ${
                    clientPhoto ? "border-accent/50 bg-accent/5" : "border-border hover:border-foreground/30"
                  }`}
                >
                  {clientPhoto ? (
                    <p className="text-xs text-foreground">{clientPhoto.name} <span className="text-muted-foreground ml-1">— click to change</span></p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      <Upload className="h-3.5 w-3.5 inline mr-1.5 -mt-0.5" />
                      Attach a photo if needed
                    </p>
                  )}
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-sm p-8 text-center transition-colors cursor-pointer ${
                    clientPhoto ? "border-accent/50 bg-accent/5" : "border-border hover:border-foreground/30"
                  }`}
                >
                  {clientPhoto ? (
                    <>
                      <ImageIcon className="h-5 w-5 mx-auto text-accent mb-3" />
                      <p className="text-sm font-medium text-foreground mb-1">{clientPhoto.name}</p>
                      <p className="text-xs text-muted-foreground">Click to change photo</p>
                    </>
                  ) : (
                    <>
                      <Upload className="h-5 w-5 mx-auto text-muted-foreground mb-3" />
                      <p className="text-sm font-medium text-foreground mb-1">Upload Client Photo *</p>
                      <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                        JPG or PNG. For best results, use natural lighting and face camera directly.
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4 flex gap-3">
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-accent text-accent-foreground hover:opacity-90 tracking-[0.18em] uppercase text-xs font-semibold h-12 px-8"
            >
              {loading ? "Creating..." : "Generate Preview"}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard")}
              className="tracking-[0.12em] uppercase text-xs h-12 px-8 border-border"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewConsultation;
