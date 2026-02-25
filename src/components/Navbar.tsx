import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-background/90 backdrop-blur-md border-b border-border"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 md:px-12 py-4">
        <span className="font-display text-sm font-semibold tracking-[0.35em] uppercase text-foreground">
          AXIS HAIR™
        </span>
        <div className="hidden md:flex items-center gap-10">
          {["Platform", "Results", "Pricing"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="text-xs tracking-[0.15em] uppercase text-muted-foreground hover:text-foreground transition-colors duration-300"
            >
              {item}
            </a>
          ))}
        </div>
        <a
          href="#pricing"
          className="text-xs tracking-[0.15em] uppercase bg-primary text-primary-foreground px-5 py-2.5 hover:opacity-90 transition-opacity"
        >
          Get Started
        </a>
      </div>
    </motion.nav>
  );
};

export default Navbar;
