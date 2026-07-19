export const T = {
  gold: "#E8B86D",
  goldDim: "#D4A853",
  goldFaint: "rgba(232,184,109,0.10)",
  goldFaint2: "rgba(232,184,109,0.06)",
  
  // Status Colors (Harmonic Status Scale)
  crimson: "#F87171",
  crimsonBg: "#3B1816",
  crimsonBorder: "rgba(248,113,113,0.30)",
  crimsonGlow: "rgba(248,113,113,0.15)",
  
  amber: "#FBA919",
  amberBg: "#382613",
  amberBorder: "rgba(251,169,25,0.30)",
  
  emerald: "#4ADE80",
  emeraldBg: "#163323",
  emeraldBorder: "rgba(74,222,128,0.30)",
  
  slateBlue: "#60A5FA",
  slateBlueBg: "#1E293B",
  slateBlueBorder: "rgba(96,165,250,0.30)",

  // Surfaces & Glass
  glass: "#211F1D",
  glassBorder: "rgba(255,255,255,0.10)",
  glassBorderHover: "rgba(232,184,109,0.25)",
  
  // Typography Colors (High contrast WCAG AA)
  text: "#F9F8F6",
  textDim: "#D4D1CA",
  textFaint: "#94A3B8",
  
  // Layouts
  sidebar: "#211F1D",
  sidebarBorder: "rgba(255,255,255,0.10)",
  bg0: "#141311",
  bgPage: "#141311",
  bgCard: "#211F1D",
  bgCardLevel2: "#2C2927",
  
  // Fonts
  mono: "'JetBrains Mono', monospace",
  serif: "'Merriweather', 'Playfair Display', serif",
  sans: "'Plus Jakarta Sans', 'Inter', sans-serif",
};

export function cn(...c: (string | undefined | false | null)[]) {
  return c.filter(Boolean).join(" ");
}
