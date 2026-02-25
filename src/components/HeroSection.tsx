import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import salon1 from "@/assets/salon-1.jpg";
import salon2 from "@/assets/salon-2.jpg";
import salon3 from "@/assets/salon-3.jpg";

const images = [salon1, salon2, salon3];

const HeroSection = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Background images */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <div
            className="absolute inset-0 animate-subtle-drift bg-cover bg-center"
            style={{ backgroundImage: `url(${images[current]})` }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Vignette */}
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, transparent 40%, hsl(30 10% 8% / 0.25) 100%)" }} />
      {/* Ivory overlay */}
      <div className="absolute inset-0 bg-axis-ivory/65" />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-center px-6 md:px-16 lg:px-24 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <h1 className="font-display font-extrabold tracking-[0.35em] uppercase text-foreground text-6xl md:text-8xl lg:text-9xl mb-5">
            AXIS HAIR™
          </h1>

          <div className="space-y-1 mb-7">
            <p className="font-display text-xl md:text-2xl tracking-[0.1em] text-foreground/85">
              Defined by structure.
            </p>
            <p className="font-display text-xl md:text-2xl tracking-[0.1em] text-foreground/85">
              Designed for you.
            </p>
          </div>

          {/* Animated divider */}
          <div className="w-0 animate-divider-expand h-px bg-foreground/30 mb-10 max-w-[200px]" />

          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="#upload"
              className="inline-block text-center text-xs tracking-[0.15em] uppercase bg-accent text-accent-foreground px-8 py-4 hover:opacity-90 transition-opacity font-semibold"
            >
              Start as a Stylist
            </a>
            <a
              href="#results"
              className="inline-block text-center text-xs tracking-[0.15em] uppercase border-2 border-foreground text-foreground px-8 py-4 hover:bg-foreground hover:text-background transition-all duration-300 font-medium"
            >
              Preview Client Experience
            </a>
          </div>
        </motion.div>
      </div>

      {/* Bottom indicator */}
      <div className="absolute bottom-8 left-6 md:left-16 lg:left-24 flex gap-3 z-10">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-px transition-all duration-500 ${
              i === current ? "w-10 bg-foreground" : "w-5 bg-foreground/30"
            }`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroSection;
