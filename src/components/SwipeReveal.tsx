import { useState, useRef, useEffect, useCallback } from "react";

const SwipeReveal = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  // Auto reveal animation on first mount
  useEffect(() => {
    if (hasAnimated) return;
    const timer = setTimeout(() => {
      let start = 50;
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

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[4/3] md:aspect-[16/10] overflow-hidden rounded-sm cursor-ew-resize select-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{ touchAction: "none" }}
    >
      {/* "Before" side — warm gray placeholder */}
      <div className="absolute inset-0 bg-secondary flex items-center justify-center">
        <div className="text-center">
          <p className="font-display text-sm tracking-[0.2em] uppercase text-muted-foreground">Before</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Original photo</p>
        </div>
      </div>

      {/* "After" side — slightly different tone */}
      <div
        className="absolute inset-0 bg-muted flex items-center justify-center"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <div className="text-center">
          <p className="font-display text-sm tracking-[0.2em] uppercase text-foreground">After</p>
          <p className="text-xs text-muted-foreground mt-1">AI-generated preview</p>
        </div>
      </div>

      {/* Divider line */}
      <div
        className="absolute top-0 bottom-0 w-px bg-foreground/40 z-10"
        style={{ left: `${position}%` }}
      >
        {/* Handle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border border-foreground/40 bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <div className="flex gap-0.5">
            <div className="w-px h-3 bg-foreground/50" />
            <div className="w-px h-3 bg-foreground/50" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SwipeReveal;
