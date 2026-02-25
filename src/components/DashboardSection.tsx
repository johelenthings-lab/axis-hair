import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const stats = [
  { value: "94%", label: "Client Approval Rate" },
  { value: "3.2×", label: "Rebooking Increase" },
  { value: "67%", label: "Fewer Revision Requests" },
  { value: "12 min", label: "Avg. Consultation Time" },
];

const DashboardSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      ref={ref}
      className="py-28 md:py-36 bg-axis-dashboard axis-grid-bg-dark"
    >
      <div className="max-w-6xl mx-auto px-6 md:px-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <p className="text-xs tracking-[0.2em] uppercase text-axis-dashboard/60 mb-6" style={{ color: "hsl(var(--axis-dashboard-fg) / 0.5)" }}>
            Performance
          </p>
          <h2 className="font-display font-bold text-3xl md:text-4xl tracking-[0.05em] text-axis-dashboard" style={{ color: "hsl(var(--axis-dashboard-fg))" }}>
            Built for measurable outcomes.
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1 * i }}
              className="text-center py-8 border rounded-sm"
              style={{
                borderColor: "hsl(var(--axis-dashboard-fg) / 0.1)",
              }}
            >
              <p
                className="font-display font-bold text-4xl md:text-5xl tracking-tight mb-2"
                style={{ color: "hsl(var(--axis-dashboard-fg))" }}
              >
                {stat.value}
              </p>
              <p
                className="text-xs tracking-[0.1em] uppercase"
                style={{ color: "hsl(var(--axis-dashboard-fg) / 0.5)" }}
              >
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DashboardSection;
