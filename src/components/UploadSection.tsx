import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Upload, Camera } from "lucide-react";

const guidelines = [
  "Face the camera directly.",
  "Use natural lighting.",
  "Pull hair away from your face.",
  "Avoid heavy filters.",
];

const UploadSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="upload" ref={ref} className="py-28 md:py-36 axis-grid-bg px-6 md:px-16">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-12"
        >
          <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-6">
            Begin
          </p>
          <h2 className="font-display font-bold text-3xl md:text-4xl tracking-[0.05em] text-foreground mb-4">
            Start with a clear photo.
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          {/* Upload area */}
          <div className="axis-card text-center py-16 mb-6 cursor-pointer group">
            <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-4 group-hover:text-foreground transition-colors" strokeWidth={1.5} />
            <p className="font-display text-sm font-medium tracking-[0.1em] uppercase text-foreground mb-2">
              Upload your photo
            </p>
            <p className="text-xs text-muted-foreground">
              JPG or PNG · Minimum 800×800
            </p>
          </div>

          {/* Guidelines */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {guidelines.map((g) => (
              <div key={g} className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-foreground mt-1.5 shrink-0" />
                <p className="text-sm text-muted-foreground">{g}</p>
              </div>
            ))}
          </div>

          {/* Inspiration upload */}
          <div className="border border-dashed rounded-sm p-6 text-center cursor-pointer hover:border-foreground/40 transition-colors" style={{ borderColor: "hsl(var(--axis-card-border))" }}>
            <Camera className="w-4 h-4 text-muted-foreground mx-auto mb-2" strokeWidth={1.5} />
            <p className="text-xs text-muted-foreground tracking-[0.1em] uppercase">
              Optional: Upload inspiration photo
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default UploadSection;
