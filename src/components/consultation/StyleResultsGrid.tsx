import { ImageIcon } from "lucide-react";
import { motion } from "framer-motion";
import type { HairstyleAsset } from "@/lib/styleLibrary";

interface StyleResultsGridProps {
  styles: HairstyleAsset[];
  remaining: number;
}

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 8 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.28,
      ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
    },
  }),
};

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
        {styles.map((style, i) => (
          <motion.div
            key={style.id}
            custom={i}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="group relative border border-border rounded-sm overflow-hidden bg-muted/30 transition-all duration-200 ease-in-out hover:border-accent/40 hover:shadow-sm hover:-translate-y-0.5"
          >
            <div className="aspect-[3/4] flex items-center justify-center bg-muted/20">
              <img
                src={style.url}
                alt={style.label}
                className="w-full h-full object-cover"
                onError={(e) => {
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
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default StyleResultsGrid;
