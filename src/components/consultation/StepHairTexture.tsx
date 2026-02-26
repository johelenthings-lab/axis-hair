import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { StepProps } from "./types";

const StepHairTexture = ({ data, onChange }: StepProps) => (
  <div className="space-y-6">
    <div>
      <h2 className="font-display text-xs tracking-[0.25em] uppercase text-muted-foreground mb-5">
        Hair Texture & Length
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        Describe the client's current hair texture and desired length.
      </p>
      <div className="grid md:grid-cols-2 gap-5 max-w-lg">
        <div className="space-y-2">
          <Label className="text-xs tracking-[0.12em] uppercase text-muted-foreground">Hair Texture</Label>
          <Select value={data.hairTexture} onValueChange={(v) => onChange("hairTexture", v)}>
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
          <Select value={data.desiredLength} onValueChange={(v) => onChange("desiredLength", v)}>
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
      </div>
    </div>
  </div>
);

export default StepHairTexture;
