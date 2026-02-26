import { ImageIcon } from "lucide-react";
import type { HairstyleAsset } from "@/lib/styleLibrary";

interface StyleResultsGridProps {
  styles: HairstyleAsset[];
  remaining: number;
}

const StyleResultsGrid = ({ styles, remaining }: StyleResultsGridProps) => {
  if (styles.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-xs tracking-[0.2em] uppercase text-muted-foreground">
          Suggested Styles
        </h3>
        <span className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground/70">
          {remaining} remaining
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {styles.map((style) => (
          <div
            key={style.id}
            className="group relative border border-border rounded-sm overflow-hidden bg-muted/30 transition-colors hover:border-accent/40"
          >
            {/* Placeholder area — real PNGs will render here once uploaded */}
            <div className="aspect-[3/4] flex items-center justify-center bg-muted/20">
              <img
                src={style.url}
                alt={style.label}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // If asset doesn't exist yet, show icon placeholder
                  e.currentTarget.style.display = "none";
                  e.currentTarget.nextElementSibling?.classList.remove("hidden");
                }}
              />
              <div className="hidden absolute inset-0 flex items-center justify-center">
                <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
              </div>
            </div>
            <div className="p-3 text-center">
              <p className="text-xs font-medium text-foreground tracking-wide">
                {style.label}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {style.filename}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StyleResultsGrid;
