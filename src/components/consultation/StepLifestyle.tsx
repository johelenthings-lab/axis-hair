import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { StepProps } from "./types";

const StepLifestyle = ({ data, onChange }: StepProps) => (
  <div className="space-y-6">
    <div>
      <h2 className="font-display text-xs tracking-[0.25em] uppercase text-muted-foreground mb-5">
        Lifestyle & Maintenance
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        Help us understand the client's daily routine and styling preferences.
      </p>
      <div className="space-y-5 max-w-lg">
        <div className="space-y-2">
          <Label className="text-xs tracking-[0.12em] uppercase text-muted-foreground">Maintenance Level</Label>
          <Select value={data.maintenanceLevel} onValueChange={(v) => onChange("maintenanceLevel", v)}>
            <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Select level" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low — Minimal Styling</SelectItem>
              <SelectItem value="medium">Medium — Some Effort</SelectItem>
              <SelectItem value="high">High — Daily Styling</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs tracking-[0.12em] uppercase text-muted-foreground">Lifestyle</Label>
          <Select value={data.lifestyle} onValueChange={(v) => onChange("lifestyle", v)}>
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
            value={data.inspirationNotes}
            onChange={(e) => onChange("inspirationNotes", e.target.value)}
            placeholder="Describe the look the client is going for, any references, or special considerations..."
            className="bg-background border-border min-h-[100px] resize-none"
          />
        </div>
      </div>
    </div>
  </div>
);

export default StepLifestyle;
