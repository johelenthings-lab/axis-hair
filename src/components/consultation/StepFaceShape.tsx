import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { StepProps } from "./types";

const FACE_SHAPES = [
  { value: "oval", label: "Oval" },
  { value: "round", label: "Round" },
  { value: "square", label: "Square" },
  { value: "heart", label: "Heart" },
  { value: "oblong", label: "Oblong" },
  { value: "diamond", label: "Diamond" },
];

const StepFaceShape = ({ data, onChange }: StepProps) => (
  <div className="space-y-6">
    <div>
      <h2 className="font-display text-xs tracking-[0.25em] uppercase text-muted-foreground mb-5">
        Face Shape
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        Select the client's face shape for the most accurate style recommendations.
      </p>
      <div className="space-y-2 max-w-sm">
        <Label className="text-xs tracking-[0.12em] uppercase text-muted-foreground">Face Shape</Label>
        <Select value={data.faceShape} onValueChange={(v) => onChange("faceShape", v)}>
          <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Select shape" /></SelectTrigger>
          <SelectContent>
            {FACE_SHAPES.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  </div>
);

export default StepFaceShape;
