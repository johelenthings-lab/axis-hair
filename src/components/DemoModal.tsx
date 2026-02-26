import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowLeft, ArrowRight, ClipboardList, Sparkles, ScanFace, ShieldCheck } from "lucide-react";

const slides = [
  {
    icon: ClipboardList,
    title: "Structured Consultation",
    text: "Clients answer guided questions for clarity and precision.",
  },
  {
    icon: Sparkles,
    title: "Smart Style Selection",
    text: "System narrows options to 3 curated styles.",
  },
  {
    icon: ScanFace,
    title: "Visual Try-On Preview",
    text: "Clients see styles placed on their photo.",
  },
  {
    icon: ShieldCheck,
    title: "Stylist Confidence",
    text: "Reduce miscommunication. Elevate every appointment.",
  },
];

interface DemoModalProps {
  open: boolean;
  onClose: () => void;
}

const DemoModal = ({ open, onClose }: DemoModalProps) => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  // Lock scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      setCurrent(0);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Keyboard nav
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  const goNext = useCallback(() => {
    if (current < slides.length - 1) {
      setDirection(1);
      setCurrent((s) => s + 1);
    }
  }, [current]);

  const goPrev = useCallback(() => {
    if (current > 0) {
      setDirection(-1);
      setCurrent((s) => s - 1);
    }
  }, [current]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-foreground/60" />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-[90vw] max-w-xl bg-card border border-border rounded-sm shadow-2xl"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 p-1 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close demo"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Step indicator */}
            <div className="px-8 pt-8 pb-0">
              <p className="font-display text-[10px] tracking-[0.3em] uppercase text-muted-foreground font-semibold">
                {current + 1} / {slides.length}
              </p>
            </div>

            {/* Slide content */}
            <div className="px-8 py-10 min-h-[220px] flex items-center">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={current}
                  custom={direction}
                  initial={{ x: direction * 30, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: direction * -30, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                  className="w-full"
                >
                  <div className="w-12 h-12 flex items-center justify-center border border-border mb-6">
                    {(() => {
                      const Icon = slides[current].icon;
                      return <Icon className="h-5 w-5 text-foreground/70" strokeWidth={1.5} />;
                    })()}
                  </div>
                  <h2 className="font-display text-2xl md:text-3xl font-bold tracking-[0.08em] uppercase text-foreground mb-4 leading-tight">
                    {slides[current].title}
                  </h2>
                  <div className="w-10 h-px bg-foreground/25 mb-5" />
                  <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-md">
                    {slides[current].text}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer: dots + arrows */}
            <div className="px-8 pb-8 flex items-center justify-between">
              {/* Dots */}
              <div className="flex gap-2">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setDirection(i > current ? 1 : -1);
                      setCurrent(i);
                    }}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      i === current
                        ? "w-6 bg-foreground"
                        : "w-2 bg-foreground/20 hover:bg-foreground/40"
                    }`}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>

              {/* Arrows */}
              <div className="flex gap-2">
                <button
                  onClick={goPrev}
                  disabled={current === 0}
                  className="p-2 border border-border text-foreground hover:bg-secondary disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                  aria-label="Previous slide"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={goNext}
                  disabled={current === slides.length - 1}
                  className="p-2 border border-border text-foreground hover:bg-secondary disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                  aria-label="Next slide"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DemoModal;
