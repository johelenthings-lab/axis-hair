import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";

const ProblemSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="relative py-28 md:py-36 axis-grid-bg">
      <div className="max-w-4xl mx-auto px-6 md:px-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
        >
          <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-6">
            The Problem
          </p>
          <h2 className="font-display font-extrabold text-3xl md:text-4xl lg:text-5xl tracking-[0.05em] text-foreground mb-8 leading-tight">
            Every appointment starts<br />with miscommunication.
          </h2>
          <div className="axis-divider max-w-[80px] mx-auto mb-8" />
          <p className="text-base md:text-lg text-foreground/65 max-w-xl mx-auto leading-relaxed">
            Clients describe what they want in words. Stylists interpret through experience. 
            The gap between expectation and outcome costs trust, time, and revenue — every single day.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default ProblemSection;
