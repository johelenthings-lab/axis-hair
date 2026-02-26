import { useState, useCallback } from "react";
import { getRandomStyles, HairstyleAsset } from "@/lib/styleLibrary";

const MAX_STYLES_PER_SESSION = 3;

export const useStyleGenerator = () => {
  const [selectedStyles, setSelectedStyles] = useState<HairstyleAsset[]>([]);
  const [generated, setGenerated] = useState(false);
  const [remaining, setRemaining] = useState(MAX_STYLES_PER_SESSION);

  const generate = useCallback(() => {
    if (generated) return; // prevent re-generation
    const styles = getRandomStyles(MAX_STYLES_PER_SESSION);
    setSelectedStyles(styles);
    setRemaining(0);
    setGenerated(true);
  }, [generated]);

  const reset = useCallback(() => {
    setSelectedStyles([]);
    setGenerated(false);
    setRemaining(MAX_STYLES_PER_SESSION);
  }, []);

  return { selectedStyles, generated, remaining, generate, reset };
};
