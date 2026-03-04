import { injectCSS } from "./utils.ts";

/* ------------------------------------------------------------------ */
/* Constants                                                          */
/* ------------------------------------------------------------------ */

export const BREAKPOINT: Record<string, number> = {
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1400,
};

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

export interface BreakpointConfig {
  name: string;
  width: number;
  top: boolean;
  bottom: boolean;
  left: boolean;
  right: boolean;
  main: boolean;
  header: boolean;
}

export interface LayoutConfig {
  system: number;
  header: number;
  footer: number;
  left: number;
  right: number;
  leftMini: number;
  rightMini: number;
  drawerSpeed: number;
}

export interface OverlayConfig {
  opacity: number;
  color: string;
}

export interface LayoutInput {
  breakpoint?: Partial<BreakpointConfig>;
  layout?: Partial<LayoutConfig>;
  overlay?: Partial<OverlayConfig>;
}

/* ------------------------------------------------------------------ */
/* Default Configuration                                              */
/* ------------------------------------------------------------------ */

const DEFAULT_BREAKPOINT: BreakpointConfig = {
  name: "",
  width: 0,
  top: false,
  bottom: false,
  left: false,
  right: false,
  header: true,
  main: true,
};

const DEFAULT_LAYOUT: LayoutConfig = {
  system: 0,
  header: 56,
  footer: 48,
  left: 240,
  right: 240,
  leftMini: 64,
  rightMini: 64,
  drawerSpeed: 0.2,
};

const DEFAULT_OVERLAY: OverlayConfig = {
  opacity: 0.45,
  color: "black",
};

/* ------------------------------------------------------------------ */
/* Main Layout Function                                               */
/* ------------------------------------------------------------------ */

export function layout({
  breakpoint = {},
  layout: layoutCfg = {},
  overlay = {},
}: LayoutInput = {}): void {
  const bp: BreakpointConfig = { ...DEFAULT_BREAKPOINT, ...breakpoint };
  const ly: LayoutConfig = { ...DEFAULT_LAYOUT, ...layoutCfg };
  const ov: OverlayConfig = { ...DEFAULT_OVERLAY, ...overlay };

  const css = [setBreakPoint(bp), setLayout({ ...ly, ...ov })].join("");

  injectCSS(css);
}

/* ------------------------------------------------------------------ */
/* Breakpoint CSS Generator                                           */
/* ------------------------------------------------------------------ */

function setBreakPoint(bp: BreakpointConfig): string {
  const marginRules: string[] = [];
  const drawerRules: string[] = [];
  const allRules: string[] = [];

  if (bp.left) marginRules.push("margin-left: 0 !important;");
  if (bp.right) marginRules.push("margin-right: 0 !important;");
  if (bp.top) drawerRules.push("top: 0 !important;");
  if (bp.bottom) drawerRules.push("bottom: 0 !important;");

  let width = bp.width;
  if (bp.name) width = BREAKPOINT[bp.name] as number;

  const margin = marginRules.join(" ");
  if (bp.main) allRules.push(`.uizy-main { ${margin} }`);
  if (bp.header) allRules.push(`.uizy-header { ${margin} }`);
  const rules = allRules.join(" ");
  return `@media (max-width: ${width}px) {${rules}.uizy-drawer { ${drawerRules.join(" ")} }}`;
}

/* ------------------------------------------------------------------ */
/* Layout CSS Generator                                               */
/* ------------------------------------------------------------------ */

const CSS_VAR_MAP: Record<string, { name: string; unit: string }> = {
  system: { name: "--uizy-system-bar-height", unit: "px" },
  header: { name: "--uizy-header-height", unit: "px" },
  footer: { name: "--uizy-footer-height", unit: "px" },
  left: { name: "--uizy-left-width", unit: "px" },
  right: { name: "--uizy-right-width", unit: "px" },
  leftMini: { name: "--uizy-left-mini-width", unit: "px" },
  rightMini: { name: "--uizy-right-mini-width", unit: "px" },
  drawerSpeed: { name: "--uizy-drawer-speed", unit: "s" },
  color: { name: "--uizy-overlay-color", unit: "" },
  opacity: { name: "--uizy-overlay-opacity", unit: "" },
};

function setLayout(vars: LayoutConfig & OverlayConfig): string {
  const cssVars = Object.entries(CSS_VAR_MAP)
    .map(([key, { name, unit }]) => `${name}: ${vars[key as keyof typeof vars]}${unit};`)
    .join(" ");

  return `:root { ${cssVars} } uizy-overlay.full { z-index: 100 !important; top: 0 !important; bottom: 0 !important; }`;
}
