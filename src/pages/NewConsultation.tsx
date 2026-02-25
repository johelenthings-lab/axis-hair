import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Upload } from "lucide-react";

const NewConsultation = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
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
          {/* Hair Profile */}
          <div>
            <h2 className="font-display text-xs tracking-[0.25em] uppercase text-muted-foreground mb-5">
              Hair Profile
            </h2>
            <div className="grid md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-xs tracking-[0.12em] uppercase text-muted-foreground">Hair Texture</Label>
                <Select>
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
                <Select>
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
                <Select>
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
                <Select>
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

          {/* Lifestyle */}
          <div>
            <h2 className="font-display text-xs tracking-[0.25em] uppercase text-muted-foreground mb-5">
              Lifestyle & Preferences
            </h2>
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-xs tracking-[0.12em] uppercase text-muted-foreground">Lifestyle</Label>
                <Select>
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
                  placeholder="Describe the look the client is going for, any references, or special considerations..."
                  className="bg-background border-border min-h-[100px] resize-none"
                />
              </div>
            </div>
          </div>

          {/* Photo Uploads */}
          <div>
            <h2 className="font-display text-xs tracking-[0.25em] uppercase text-muted-foreground mb-5">
              Photo Upload
            </h2>

            <div className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-sm p-8 text-center hover:border-foreground/30 transition-colors cursor-pointer">
                <Upload className="h-5 w-5 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm font-medium text-foreground mb-1">Upload Client Photo</p>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  For best results, use natural lighting and face camera directly.
                </p>
              </div>

              <div className="border border-dashed border-border rounded-sm p-6 text-center hover:border-foreground/30 transition-colors cursor-pointer">
                <Upload className="h-4 w-4 mx-auto text-muted-foreground mb-2" />
                <p className="text-xs font-medium text-foreground mb-1">
                  Upload Inspiration Photo <span className="text-muted-foreground/60">(optional)</span>
                </p>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4 flex gap-3">
            <Button
              className="bg-accent text-accent-foreground hover:opacity-90 tracking-[0.18em] uppercase text-xs font-semibold h-12 px-8"
            >
              Generate Preview
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
