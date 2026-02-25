import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Check } from "lucide-react";

const features = [
  "AI-powered style previews",
  "Structured client intake",
  "Approval workflow",
  "Client history dashboard",
  "Unlimited consultations",
  "Priority support",
];

const PricingSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="pricing" ref={ref} className="py-28 md:py-36 px-6 md:px-16">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-12"
        >
          <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-6">
            Pricing
          </p>
          <h2 className="font-display font-bold text-3xl md:text-4xl tracking-[0.05em] text-foreground">
            One plan. Full access.
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="border-2 rounded-sm p-10 md:p-12 text-center"
          style={{ borderColor: "hsl(var(--axis-charcoal))" }}
        >
          <p className="font-display font-bold text-6xl md:text-7xl tracking-tight text-foreground mb-2">
            $79
          </p>
          <p className="text-sm text-muted-foreground tracking-[0.1em] uppercase mb-10">
            per month · per stylist
          </p>

          <div className="axis-divider mb-10" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left mb-10">
            {features.map((f) => (
              <div key={f} className="flex items-center gap-3">
                <Check className="w-4 h-4 text-foreground shrink-0" strokeWidth={1.5} />
                <p className="text-sm text-foreground/80">{f}</p>
              </div>
            ))}
          </div>

          <button className="w-full text-xs tracking-[0.15em] uppercase bg-primary text-primary-foreground px-8 py-4 hover:opacity-90 transition-opacity font-medium">
            Start 14-Day Free Trial
          </button>
          <p className="text-xs text-muted-foreground mt-4">
            No credit card required.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default PricingSection;
