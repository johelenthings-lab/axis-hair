import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useNavigate } from "react-router-dom";

const ClosingSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const navigate = useNavigate();

  return (
    <section ref={ref} className="py-28 md:py-36 px-6 md:px-16">
      <div className="max-w-2xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="space-y-6"
        >
          <h2 className="font-display font-bold text-3xl md:text-4xl tracking-[0.05em] text-foreground">
            Your consultations deserve structure.
          </h2>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-lg mx-auto">
            AXIS HAIR™ helps you prepare, present, and perform at a higher level — without adding complexity to your workflow.
          </p>

          <div className="axis-divider max-w-[120px] mx-auto !my-10" />

          <button
            onClick={() => navigate("/signup")}
            className="text-xs tracking-[0.15em] uppercase bg-accent text-accent-foreground px-10 py-4 hover:opacity-90 transition-opacity font-semibold"
          >
            Start Free Trial
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default ClosingSection;
