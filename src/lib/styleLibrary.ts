export interface HairstyleAsset {
  id: string;
  filename: string;
  label: string;
  url: string;
}

const HAIRSTYLE_FILENAMES = [
  { id: "blunt_bob", filename: "blunt_bob.png", label: "Blunt Bob" },
  { id: "textured_lob", filename: "textured_lob.png", label: "Textured Lob" },
  { id: "curtain_layers", filename: "curtain_layers.png", label: "Curtain Layers" },
  { id: "long_sleek_layers", filename: "long_sleek_layers.png", label: "Long Sleek Layers" },
  { id: "shoulder_layers", filename: "shoulder_layers.png", label: "Shoulder Layers" },
  { id: "soft_blowout", filename: "soft_blowout.png", label: "Soft Blowout" },
  { id: "curly_bob", filename: "curly_bob.png", label: "Curly Bob" },
  { id: "afro_volume", filename: "afro_volume.png", label: "Afro Volume" },
  { id: "twist_out", filename: "twist_out.png", label: "Twist Out" },
  { id: "box_braids", filename: "box_braids.png", label: "Box Braids" },
  { id: "low_taper_fade", filename: "low_taper_fade.png", label: "Low Taper Fade" },
  { id: "mid_fade_crop", filename: "mid_fade_crop.png", label: "Mid Fade Crop" },
  { id: "french_crop", filename: "french_crop.png", label: "French Crop" },
  { id: "modern_pompadour", filename: "modern_pompadour.png", label: "Modern Pompadour" },
  { id: "curly_top_fade", filename: "curly_top_fade.png", label: "Curly Top Fade" },
  { id: "short_afro", filename: "short_afro.png", label: "Short Afro" },
  { id: "locs_medium", filename: "locs_medium.png", label: "Locs Medium" },
  { id: "waves_style", filename: "waves_style.png", label: "Waves Style" },
] as const;

export const STYLE_LIBRARY: HairstyleAsset[] = HAIRSTYLE_FILENAMES.map((s) => ({
  ...s,
  url: `/hairstyles/${s.filename}`,
}));

/** Return `count` random styles from the library (Fisher-Yates sample). */
export const getRandomStyles = (count = 3): HairstyleAsset[] => {
  const pool = [...STYLE_LIBRARY];
  const picks: HairstyleAsset[] = [];
  for (let i = 0; i < Math.min(count, pool.length); i++) {
    const j = Math.floor(Math.random() * (pool.length - i)) + i;
    [pool[i], pool[j]] = [pool[j], pool[i]];
    picks.push(pool[i]);
  }
  return picks;
};
