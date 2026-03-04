/**
 * Screen Store
 *
 * Reactive nanostore that tracks the current viewport width and breakpoint size.
 * Automatically updates on window resize.
 *
 * @example
 * ```ts
 * import { $screen } from "./screen.ts";
 *
 * $screen.get(); // { width: 1024, size: "lg" }
 *
 * $screen.subscribe(({ width, size }) => {
 *   console.log(`Viewport: ${width}px (${size})`);
 * });
 * ```
 */

import { map } from "nanostores";
import { BREAKPOINT } from "./layout.ts";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

export interface ScreenState {
  /** Current viewport width in pixels */
  width: number;
  /** Current breakpoint name (xs when below sm) */
  size: string;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Breakpoint entries sorted descending by width for fast matching */
const BP_DESC = Object.entries(BREAKPOINT).sort(([, a], [, b]) => b - a);

function getSize(width: number): string {
  for (const [name, min] of BP_DESC) {
    if (width >= min) return name;
  }
  return "xs";
}

function getState(): ScreenState {
  const width = window.innerWidth;
  return { width, size: getSize(width) };
}

/* ------------------------------------------------------------------ */
/* Store                                                              */
/* ------------------------------------------------------------------ */

export const $screen = map<ScreenState>(getState());

/* ------------------------------------------------------------------ */
/* Listener                                                           */
/* ------------------------------------------------------------------ */

let listening = false;

export function startScreenListener(): void {
  if (listening) return;
  listening = true;

  window.addEventListener("resize", () => {
    const next = getState();
    const current = $screen.get();
    if (next.width !== current.width || next.size !== current.size) {
      $screen.set(next);
    }
  });
}
