import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const steps = [
  { number: "01", title: "Create Consultation", description: "Capture client details, goals, and preferences in a guided intake flow." },
  { number: "02", title: "Generate AI Recommendation + Preview", description: "Receive a structured recommendation and visual preview powered by AI." },
  { number: "03", title: "Approve, Share, and Track Revenue", description: "Client approves, you share the result, and revenue is tracked automatically." },
];

const HowItWorksSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="py-28 md:py-36 px-6 md:px-16">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-6">
            How It Works
          </p>
          <h2 className="font-display font-bold text-3xl md:text-4xl tracking-[0.05em] text-foreground">
            Three steps. No complexity.
          </h2>
        </motion.div>

        <div className="space-y-0">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 16 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.12 * i }}
              className="flex items-start gap-6 md:gap-8 py-8 border-b border-border last:border-b-0"
            >
              <span className="font-display text-2xl md:text-3xl font-extrabold text-foreground/15 shrink-0 leading-none pt-1">
                {step.number}
              </span>
              <div>
                <h3 className="font-display font-semibold text-base md:text-lg tracking-[0.03em] text-foreground mb-1">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
