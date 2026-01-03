// Base path for GitHub Pages (must match vite.config.ts base)
const BASE = "/uizy";

// Site configuration - change these to customize the documentation
export const config = {
  // Library info
  name: "U-izy",
  shortName: "Uizy",
  tagline: "Tiny footprint, limitless possibilities",
  description: "A beginner-friendly utility-first CSS framework",
  emoji: "🌐",

  // URLs
  npm: "@dufeutech/uizy",
  cdn: "https://unpkg.com/@dufeutech/uizy/dist/index.css",
  github: "https://github.com/dufeutech/uizy",

  // Base path
  base: BASE,
};

// Helper to create internal links with base path
export const link = (path: string) => `${BASE}${path}`;
