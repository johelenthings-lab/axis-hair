import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { StepProps } from "./types";

const StepClientInfo = ({ data, onChange }: StepProps) => (
  <div className="space-y-8">
    <div>
      <h2 className="font-display text-xs tracking-[0.25em] uppercase text-muted-foreground mb-5">
        Service Type
      </h2>
      <Select value={data.serviceType} onValueChange={(v) => onChange("serviceType", v as any)}>
        <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="quick_service">Quick Maintenance / Trim</SelectItem>
          <SelectItem value="full_preview">Full Style Consultation</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div>
      <h2 className="font-display text-xs tracking-[0.25em] uppercase text-muted-foreground mb-5">
        Client Information
      </h2>
      <div className="grid md:grid-cols-3 gap-5">
        <div className="space-y-2">
          <Label className="text-xs tracking-[0.12em] uppercase text-muted-foreground">Client Name *</Label>
          <Input value={data.clientName} onChange={(e) => onChange("clientName", e.target.value)} className="bg-background border-border" placeholder="Full name" />
        </div>
        <div className="space-y-2">
          <Label className="text-xs tracking-[0.12em] uppercase text-muted-foreground">Email <span className="normal-case text-muted-foreground/60">(optional)</span></Label>
          <Input type="email" value={data.clientEmail} onChange={(e) => onChange("clientEmail", e.target.value)} className="bg-background border-border" />
        </div>
        <div className="space-y-2">
          <Label className="text-xs tracking-[0.12em] uppercase text-muted-foreground">Phone <span className="normal-case text-muted-foreground/60">(optional)</span></Label>
          <Input type="tel" value={data.clientPhone} onChange={(e) => onChange("clientPhone", e.target.value)} className="bg-background border-border" />
        </div>
      </div>
    </div>
  </div>
);

export default StepClientInfo;
