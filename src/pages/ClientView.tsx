import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const ClientView = () => {
  const { id } = useParams();
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
        <span className="text-xs tracking-[0.12em] uppercase text-muted-foreground ml-auto">
          Client Preview #{id}
        </span>
      </header>

      <div className="max-w-5xl mx-auto px-6 md:px-12 py-12">
        <div className="grid lg:grid-cols-2 gap-10">
          {/* Preview Area */}
          <div>
            <h2 className="font-display text-xs tracking-[0.25em] uppercase text-muted-foreground mb-5">
              Style Preview
            </h2>
            <div className="aspect-[3/4] bg-muted rounded-sm flex items-center justify-center border border-border">
              <div className="text-center">
                <div className="w-32 h-32 rounded-full bg-border mx-auto mb-4" />
                <p className="text-xs tracking-[0.12em] uppercase text-muted-foreground">
                  Swipe preview area
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Head + shoulders crop
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3 justify-center">
              <div className="h-px flex-1 bg-border" />
              <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
                Drag to compare
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>
          </div>

          {/* Details */}
          <div>
            <h2 className="font-display text-xs tracking-[0.25em] uppercase text-muted-foreground mb-5">
              Recommendation
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="font-display text-2xl font-semibold tracking-[0.1em] uppercase text-foreground">
                  Modern Textured Crop
                </h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  A structured crop that enhances natural texture while maintaining clean lines. 
                  This style works with your hair's natural movement pattern rather than against it.
                </p>
              </div>

              <div className="h-px bg-border" />

              <div className="space-y-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs tracking-[0.12em] uppercase text-muted-foreground">Why It Works</span>
                  <span className="text-sm text-foreground">Complements face shape + natural texture</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-xs tracking-[0.12em] uppercase text-muted-foreground">Maintenance Level</span>
                  <span className="text-sm text-foreground">Low — minimal daily styling</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-xs tracking-[0.12em] uppercase text-muted-foreground">Estimated Time</span>
                  <span className="text-sm text-foreground">45 minutes</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-xs tracking-[0.12em] uppercase text-muted-foreground">Estimated Cost</span>
                  <span className="text-sm text-foreground">$65 – $85</span>
                </div>
              </div>

              <div className="h-px bg-border" />

              <div className="flex gap-3 pt-2">
                <Button className="flex-1 bg-accent text-accent-foreground hover:opacity-90 tracking-[0.18em] uppercase text-xs font-semibold h-12">
                  Approve This Look
                </Button>
                <Button variant="outline" className="flex-1 tracking-[0.12em] uppercase text-xs h-12 border-border">
                  Request Adjustment
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientView;
