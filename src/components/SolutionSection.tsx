import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Eye, Sparkles, BarChart3 } from "lucide-react";

const pillars = [
  {
    icon: Eye,
    title: "Client Preview Confidence",
    description:
      "Let clients visualize potential results before the appointment. Reduce uncertainty and increase trust.",
  },
  {
    icon: Sparkles,
    title: "Professional AI Recommendations",
    description:
      "Structured, stylist-driven recommendations that feel personal — not generic.",
  },
  {
    icon: BarChart3,
    title: "Built-In Revenue Clarity",
    description:
      "Track approved consultations and expected income automatically — without spreadsheets.",
  },
];

const SolutionSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="platform" ref={ref} className="py-28 md:py-36 px-6 md:px-16">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-6">
            The Platform
          </p>
          <h2 className="font-display font-bold text-3xl md:text-4xl tracking-[0.05em] text-foreground">
            Three pillars. One system.
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {pillars.map((pillar, i) => (
            <motion.div
              key={pillar.title}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.15 * i }}
              className="axis-card"
            >
              <pillar.icon className="w-4 h-4 text-foreground/70 mb-6" strokeWidth={1.5} />
              <h3 className="font-display font-extrabold text-lg tracking-[0.05em] text-foreground mb-3">
                {pillar.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {pillar.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SolutionSection;
