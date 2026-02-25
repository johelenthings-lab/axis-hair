import { useState, useRef, useEffect, useCallback } from "react";

interface SwipeRevealProps {
  beforeUrl?: string | null;
  afterUrl?: string | null;
  beforeLabel?: string;
  afterLabel?: string;
}

const SwipeReveal = ({
  beforeUrl,
  afterUrl,
  beforeLabel = "Before",
  afterLabel = "After",
}: SwipeRevealProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  // Auto reveal animation on first mount
  useEffect(() => {
    if (hasAnimated) return;
    const timer = setTimeout(() => {
      const start = 50;
      const target = 60;
      const duration = 800;
      const startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        if (progress < 0.5) {
          setPosition(start + (target - start) * (eased * 2));
        } else {
          setPosition(target - (target - start) * ((eased - 0.5) * 2));
        }
        if (progress < 1) requestAnimationFrame(animate);
        else setHasAnimated(true);
      };
      animate();
    }, 1000);
    return () => clearTimeout(timer);
  }, [hasAnimated]);

  const updatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.max(5, Math.min(95, x)));
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    updatePosition(e.clientX);
  }, [updatePosition]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    updatePosition(e.clientX);
  }, [isDragging, updatePosition]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const renderContent = (url: string | null | undefined, label: string, sublabel: string) => {
    if (url) {
      return <img src={url} alt={label} className="absolute inset-0 w-full h-full object-cover object-top" />;
    }
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <p className="font-display text-sm tracking-[0.2em] uppercase text-muted-foreground">{label}</p>
          <p className="text-xs text-muted-foreground/60 mt-1">{sublabel}</p>
        </div>
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[3/4] overflow-hidden rounded-sm cursor-ew-resize select-none border border-border"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{ touchAction: "none" }}
    >
      {/* "Before" side */}
      <div className="absolute inset-0 bg-secondary">
        {renderContent(beforeUrl, beforeLabel, "Original photo")}
        <span className="absolute bottom-3 left-3 text-[10px] tracking-[0.15em] uppercase bg-background/70 backdrop-blur-sm text-foreground px-2 py-1 rounded-sm pointer-events-none">
          {beforeLabel}
        </span>
      </div>

      {/* "After" side */}
      <div
        className="absolute inset-0 bg-muted"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        {renderContent(afterUrl, afterLabel, "AI-generated preview")}
        <span className="absolute bottom-3 left-3 text-[10px] tracking-[0.15em] uppercase bg-background/70 backdrop-blur-sm text-foreground px-2 py-1 rounded-sm pointer-events-none">
          {afterLabel}
        </span>
      </div>

      {/* Divider line */}
      <div
        className="absolute top-0 bottom-0 w-px bg-foreground/50 z-10"
        style={{ left: `${position}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full border border-foreground/50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <div className="flex gap-0.5">
            <div className="w-px h-2.5 bg-foreground/60" />
            <div className="w-px h-2.5 bg-foreground/60" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SwipeReveal;
