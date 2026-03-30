import { Globe } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";

const Navbar = () => {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const handleLanguageCycle = () => {
    if (language === "en") setLanguage("es");
    else if (language === "es") setLanguage("fr");
    else setLanguage("en");
  };

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-background/95 backdrop-blur-md border-b border-border shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 md:px-12 py-4">
        <span className="font-display text-sm font-semibold tracking-[0.4em] uppercase text-foreground">
          AXIS HAIR™
        </span>
        <div className="hidden md:flex items-center gap-10">
          {["Platform", "Dashboard", "Pricing"].map((item) => (
            <a
              key={item}
              href={`#${item === "Dashboard" ? "dashboard" : item.toLowerCase()}`}
              className="text-xs tracking-[0.18em] uppercase text-foreground/60 hover:text-foreground transition-colors duration-300"
            >
              {item}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleLanguageCycle}
            className="flex items-center gap-2 text-[10px] tracking-[0.12em] uppercase px-3 py-2 font-semibold text-muted-foreground hover:text-foreground transition-all duration-300 border border-border/50 rounded-sm hover:bg-accent/10"
          >
            <Globe className="w-3 h-3 opacity-60" />
            <span>{language.toUpperCase()}</span>
          </button>
          <button
            onClick={() => navigate("/signup")}
            className="text-xs tracking-[0.18em] uppercase bg-accent text-accent-foreground px-5 py-2.5 font-semibold hover:opacity-90 transition-opacity"
          >
            {t("get_started")}
          </button>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
