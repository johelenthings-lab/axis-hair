import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import SwipeReveal from "./SwipeReveal";
import salonResults from "@/assets/salon-results.jpg";

const ResultsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="results" ref={ref} className="relative py-24 md:py-32 px-6 md:px-16 overflow-hidden">
      {/* Salon background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${salonResults})` }}
      />
      <div className="absolute inset-0 bg-axis-ivory/95" />
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, transparent 50%, hsl(30 10% 8% / 0.07) 100%)" }} />

      <div className="max-w-5xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-6">
            Results
          </p>
          <h2 className="font-display font-bold text-3xl md:text-4xl tracking-[0.05em] text-foreground">
            Preview with precision.
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <SwipeReveal />
        </motion.div>

        {/* Details below swipe */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-12 max-w-2xl mx-auto"
        >
          <div className="axis-divider mb-8" />
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div>
              <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground mb-1">Style</p>
              <p className="font-display font-semibold text-foreground">Textured Crop</p>
            </div>
            <div>
              <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground mb-1">Why It Works</p>
              <p className="text-sm text-foreground/80">Enhances natural wave pattern with minimal daily styling</p>
            </div>
            <div>
              <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground mb-1">Maintenance</p>
              <p className="text-sm text-foreground/80">Low — trim every 4–5 weeks</p>
            </div>
            <div>
              <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground mb-1">Est. Time & Cost</p>
              <p className="text-sm text-foreground/80">45 min · $55–$75</p>
            </div>
          </div>
          <div className="flex gap-4">
            <button className="flex-1 text-xs tracking-[0.15em] uppercase bg-accent text-accent-foreground px-6 py-3.5 hover:opacity-90 transition-opacity font-semibold">
              Approve This Look
            </button>
            <button className="flex-1 text-xs tracking-[0.15em] uppercase border-2 border-foreground text-foreground px-6 py-3.5 hover:bg-foreground hover:text-background transition-all duration-300 font-medium">
              Request Adjustment
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ResultsSection;
