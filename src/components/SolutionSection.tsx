import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Eye, ClipboardList, CheckCircle } from "lucide-react";

const modules = [
  {
    icon: Eye,
    title: "AI Preview",
    description:
      "Generate realistic hairstyle previews before the first cut. Clients see structure, not guesswork.",
  },
  {
    icon: ClipboardList,
    title: "Structured Intake",
    description:
      "Guided consultation flow captures texture, history, lifestyle, and goals. No detail left to chance.",
  },
  {
    icon: CheckCircle,
    title: "Approval Workflow",
    description:
      "Client reviews and approves the look before the appointment. Alignment is built into the process.",
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
            Three systems. One workflow.
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {modules.map((mod, i) => (
            <motion.div
              key={mod.title}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.15 * i }}
              className="axis-card"
            >
              <mod.icon className="w-5 h-5 text-foreground mb-6" strokeWidth={1.5} />
              <h3 className="font-display font-bold text-lg tracking-[0.05em] text-foreground mb-3">
                {mod.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {mod.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SolutionSection;
