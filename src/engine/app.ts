import {
  Components,
  Stores,
  Directives,
  type DirectiveContext,
  type DirectiveBinding,
} from "./components.ts";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

interface ClipOptions {
  top?: boolean;
  bottom?: boolean;
  left?: boolean;
  right?: boolean;
  leftMini?: boolean;
  rightMini?: boolean;
  system?: boolean;
}

type ShadowDirection = "t" | "b" | "l" | "r";

/* ------------------------------------------------------------------ */
/* Constants                                                          */
/* ------------------------------------------------------------------ */

const CLASS = {
  SYSTEM_BAR: "uizy-system-bar",
  HEADER: "uizy-header",
  FOOTER: "uizy-footer",
  OVERLAY: "uizy-overlay-mask",
  MAIN: "uizy-main",
  DRAWER: "uizy-drawer",
  DRAWER_OPEN: "uizy-drawer--open",
  FLEX: "d-flex",
  FLEX_COL: "df-col",
  FLEX_SB: "dx-sb",
  FULL: "full",
} as const;

const CLIP_CLASS_MAP: Record<keyof ClipOptions, string> = {
  system: "uizy-clip-system-bar",
  top: "uizy-clip-top",
  bottom: "uizy-clip-bottom",
  left: "uizy-clip-left",
  right: "uizy-clip-right",
  leftMini: "uizy-clip-left-mini",
  rightMini: "uizy-clip-right-mini",
};

const CLIP_ATTR_MAP: Record<keyof ClipOptions, string> = {
  system: "clip-system",
  top: "clip-top",
  bottom: "clip-bottom",
  left: "clip-left",
  right: "clip-right",
  leftMini: "clip-left-mini",
  rightMini: "clip-right-mini",
};

const SELECTORS: Record<string, string> = {
  system: "uizy-system-bar",
  header: "uizy-header",
  footer: "uizy-footer",
  overlay: "uizy-overlay",
  main: "uizy-main",
  left: "uizy-drawer:not([right]):not([mini])",
  leftMini: "uizy-drawer:not([right])[mini]",
  right: "uizy-drawer[right]:not([mini])",
  rightMini: "uizy-drawer[right][mini]",
};

/** Standard DOM event names (same as native onclick, onmouseover, etc.) */
const DOM_EVENTS = new Set([
  "click",
  "dblclick",
  "mousedown",
  "mouseup",
  "mouseover",
  "mouseout",
  "mousemove",
  "mouseenter",
  "mouseleave",
  "contextmenu",
  "keydown",
  "keyup",
  "keypress",
  "focus",
  "blur",
  "focusin",
  "focusout",
  "input",
  "change",
  "submit",
  "reset",
  "touchstart",
  "touchend",
  "touchmove",
  "touchcancel",
  "drag",
  "dragstart",
  "dragend",
  "dragover",
  "dragenter",
  "dragleave",
  "drop",
  "scroll",
  "wheel",
  "copy",
  "cut",
  "paste",
  "animationstart",
  "animationend",
  "animationiteration",
  "transitionstart",
  "transitionend",
  "transitionrun",
  "transitioncancel",
  "pointerdown",
  "pointerup",
  "pointermove",
  "pointerover",
  "pointerout",
  "pointerenter",
  "pointerleave",
  "pointercancel",
]);

/* ------------------------------------------------------------------ */
/* Utilities                                                          */
/* ------------------------------------------------------------------ */

const csx = (...inputs: unknown[]): string =>
  inputs
    .flatMap((i) => {
      if (typeof i === "string") return i;
      if (i && typeof i === "object") {
        return Object.entries(i)
          .filter(([, v]) => v)
          .map(([k]) => k);
      }
      return [];
    })
    .filter(Boolean)
    .join(" ");

const qs = <T extends Element = Element>(selector: string): T | null =>
  document.querySelector<T>(selector);

const clipClasses = (options: ClipOptions = {}): string =>
  csx(
    Object.fromEntries(
      Object.entries(options)
        .filter(([, enabled]) => enabled)
        .map(([key]) => [CLIP_CLASS_MAP[key as keyof ClipOptions], true])
    )
  );

const shadowClass = (direction: ShadowDirection, level?: number): string =>
  level && level > 0 ? `s${direction}-${level}` : "";

const parseClip = (el: HTMLElement): ClipOptions =>
  Object.fromEntries(
    Object.entries(CLIP_ATTR_MAP).map(([key, attr]) => [
      key,
      el.hasAttribute(attr),
    ])
  ) as ClipOptions;

/* ------------------------------------------------------------------ */
/* Base Element                                                       */
/* ------------------------------------------------------------------ */

abstract class BaseElement extends HTMLElement {
  protected updateClass(classes: unknown[]) {
    this.className = csx(...classes, this.className);
  }

  protected get clip(): ClipOptions {
    return parseClip(this);
  }

  protected getShadowLevel(attrName = "shadow"): number {
    return Number(this.getAttribute(attrName)) || 0;
  }
}

/* ------------------------------------------------------------------ */
/* Web Components                                                     */
/* ------------------------------------------------------------------ */

class UizySystemBar extends BaseElement {
  connectedCallback() {
    this.updateClass([CLASS.SYSTEM_BAR]);
  }
}

class UizyHeader extends BaseElement {
  connectedCallback() {
    this.updateClass([
      CLASS.FLEX,
      CLASS.FLEX_SB,
      CLASS.HEADER,
      shadowClass("b", this.getShadowLevel()),
    ]);
  }
}

class UizyFooter extends BaseElement {
  connectedCallback() {
    this.updateClass([CLASS.FOOTER, shadowClass("t", this.getShadowLevel())]);
  }
}

class UizyOverlay extends BaseElement {
  connectedCallback() {
    this.updateClass([CLASS.OVERLAY, clipClasses(this.clip)]);
    Object.assign(this.style, {
      background: "var(--uizy-overlay-color)",
      opacity: "var(--uizy-overlay-opacity)",
      display: "none",
    });
  }
}

class UizyMain extends BaseElement {
  connectedCallback() {
    this.updateClass([CLASS.MAIN, clipClasses(this.clip)]);
  }
}

class UizyDrawer extends BaseElement {
  connectedCallback() {
    const isLeft = !this.hasAttribute("right");
    const position = isLeft ? "left" : "right";
    const open = this.hasAttribute("open");
    const mini = this.hasAttribute("mini");

    this.updateClass([
      CLASS.FLEX,
      CLASS.FLEX_COL,
      CLASS.DRAWER,
      `uizy-${position}`,
      `uizy-drawer--${position}`,
      shadowClass(isLeft ? "r" : "l", this.getShadowLevel()),
      { [`uizy-${position}--mini`]: mini, [CLASS.DRAWER_OPEN]: open },
      clipClasses(this.clip),
    ]);
  }
}

type ActionPayload = {
  set: (open?: boolean | null, full?: boolean) => void;
  self: HTMLElement;
};

class UizyApp extends BaseElement {
  private initialized = false;
  private parts: Record<string, HTMLElement | null> = {};

  private ensureInitialized(): void {
    if (this.initialized) return;
    for (const key of Object.keys(SELECTORS)) {
      this.parts[key] = qs<HTMLElement>(SELECTORS[key]);
    }
    this.initialized = true;
  }

  private toggleDisplay(
    el: HTMLElement,
    open?: boolean | null,
    full?: boolean
  ): void {
    const isHidden = el.style.display === "none";
    el.style.display = open ?? !isHidden ? "block" : "none";
    el.classList.toggle(CLASS.FULL, Boolean(full));
  }

  private toggleDrawer(el: HTMLElement, open?: boolean | null): void {
    el.classList.toggle(CLASS.DRAWER_OPEN, open ?? undefined);
  }

  private toggleMain(
    el: HTMLElement,
    side?: string,
    open?: boolean | null
  ): void {
    if (side === "left") {
      el.classList.toggle(CLIP_CLASS_MAP.left, open ?? undefined);
    } else {
      el.classList.toggle(CLIP_CLASS_MAP.right, open ?? undefined);
    }
  }

  action(section: string, callback: (payload: ActionPayload) => void): void {
    this.ensureInitialized();

    const [root, part] = section.split(".");
    const key = part
      ? `${root}${part.charAt(0).toUpperCase()}${part.slice(1)}`
      : root;
    const el = this.parts[key];

    if (!el || typeof callback !== "function") return;

    const isDrawer = ["left", "right", "leftMini", "rightMini"].includes(key);
    const isOverlay = key === "overlay";
    const isMain = key === "main";

    if (!isDrawer && !isOverlay && !isMain) return;

    if (isMain) {
      callback({
        self: el,
        set: (side, open) => this.toggleMain(el, String(side), open),
      });
    } else {
      const payload: ActionPayload = {
        set: isOverlay
          ? (open, full) => this.toggleDisplay(el, open, full)
          : (open) => this.toggleDrawer(el, open),
        self: el,
      };

      callback(payload);
    }
  }
}

/** Converts a value to displayable text (JSON for objects/arrays) */
const toDisplayText = (value: unknown): string => {
  if (value == null) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

/* ------------------------------------------------------------------ */
/* Toggle                                                             */
/* ------------------------------------------------------------------ */

const TOGGLE_TARGETS: Record<string, string> = {
  left: "left",
  right: "right",
  "left-mini": "left.mini",
  "right-mini": "right.mini",
};

class UizyToggle extends BaseElement {
  private cleanup: (() => void) | null = null;

  connectedCallback() {
    this.updateClass(["uizy-toggle"]);

    if (!this.hasAttribute("tabindex")) this.setAttribute("tabindex", "0");
    if (!this.hasAttribute("role")) this.setAttribute("role", "button");
    this.style.cursor = "pointer";

    const handleActivate = () => this.toggle();
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        this.toggle();
      }
    };

    this.addEventListener("click", handleActivate);
    this.addEventListener("keydown", handleKeydown);
    this.cleanup = () => {
      this.removeEventListener("click", handleActivate);
      this.removeEventListener("keydown", handleKeydown);
    };
  }

  disconnectedCallback() {
    this.cleanup?.();
    this.cleanup = null;
  }

  private getApp(): UizyApp | null {
    return this.closest<UizyApp>("uizy-app");
  }

  private getTarget(): string | null {
    for (const [attr, section] of Object.entries(TOGGLE_TARGETS)) {
      if (this.hasAttribute(attr)) return section;
    }
    return null;
  }

  private toggle(): void {
    const app = this.getApp();
    const target = this.getTarget();
    if (!app || !target) return;

    app.action(target, ({ set, self }) => {
      set();
      const isOpen = self.classList.contains(CLASS.DRAWER_OPEN);
      this.classList.toggle("uizy-toggle--active", isOpen);
    });
  }
}

/* ------------------------------------------------------------------ */
/* Box                                                                */
/* ------------------------------------------------------------------ */

class UizyBox extends BaseElement {
  private cleanupFns: Array<() => void> = [];

  connectedCallback() {
    // Reactive text binding - subscribes to store changes
    const textPath = this.getAttribute(":text") ?? this.getAttribute("u-text");
    if (textPath && Stores.has(textPath)) {
      const store = Stores.call<unknown>(textPath, { raw: true }) as
        | { subscribe: (cb: (value: unknown) => void) => () => void }
        | undefined;
      if (store?.subscribe) {
        const unsubscribe = store.subscribe((value) => {
          this.textContent = toDisplayText(value);
        });
        this.cleanupFns.push(unsubscribe);
      }
    }

    // Component classes with optional props (supports multiple space-separated components)
    const use = this.getAttribute("use");
    if (use) {
      // Parse props from use:props attribute (JSON)
      const propsAttr = this.getAttribute("use:props");
      let props: unknown = undefined;
      if (propsAttr) {
        // From JS
        const propsJson = propsAttr
          .replace(/([{,]\s*)(\w+)\s*:/g, '$1"$2":') // add key quotes
          .replace(/'/g, '"'); // normalize quotes if needed
        // Parse JSON
        try {
          props = JSON.parse(propsJson);
        } catch {
          console.warn(`[uizy] Invalid JSON in use:props: ${propsAttr}`);
        }
      }

      // Helper to extract classes from component result
      const extractClasses = (result: unknown): string[] => {
        if (typeof result === "string") return [result];
        if (Array.isArray(result)) return result;
        if (result && typeof result === "object") {
          // Object format: { "class-name": boolean }
          return Object.entries(result)
            .filter(([, enabled]) => enabled)
            .map(([className]) => className);
        }
        return [];
      };

      // Split by whitespace and process each component
      const componentNames = use.trim().split(/\s+/);
      const allClasses: string[] = [];

      for (const name of componentNames) {
        if (!Components.has(name)) continue;
        const vm = Components.call(name, props);
        allClasses.push(...extractClasses(vm));
      }

      if (allClasses.length > 0) {
        this.updateClass(allClasses);
      }
    }

    // Event handlers and directives
    this.bindAttributes();
  }

  private bindAttributes(): void {
    // Collect all directive bindings grouped by directive name
    const directiveBindings = new Map<string, DirectiveBinding[]>();

    for (const attr of this.attributes) {
      // Support both :foo and u-foo prefixes
      const isColonPrefix = attr.name.startsWith(":");
      const isUPrefix = attr.name.startsWith("u-");

      if (!isColonPrefix && !isUPrefix) continue;

      // Parse the attribute name based on prefix:
      // :name:modifier1:modifier2="value" (colon prefix, colon-separated modifiers)
      // u-name:modifier1:modifier2="value" (u- prefix, colon-separated modifiers)
      let fullName: string;
      let modifiers: string[];

      if (isColonPrefix) {
        const parts = attr.name.slice(1).split(":");
        fullName = parts[0];
        modifiers = parts.slice(1);
      } else {
        // u-name:modifier1:modifier2
        const parts = attr.name.slice(2).split(":");
        fullName = parts[0];
        modifiers = parts.slice(1);
      }

      const value = attr.value;

      // Skip :text (handled above)
      if (fullName === "text") continue;

      // Check if it's a DOM event (only for : prefix)
      if (isColonPrefix && DOM_EVENTS.has(fullName)) {
        this.bindEvent(fullName, value);
        continue;
      }

      // Collect directive bindings (group by directive name)
      if (Directives.has(fullName)) {
        // arg is the first modifier (e.g., "one" from ":toy:one" or "u-toy:one")
        const arg = modifiers[0] || "";

        const binding: DirectiveBinding = {
          value,
          arg,
        };

        if (!directiveBindings.has(fullName)) {
          directiveBindings.set(fullName, []);
        }
        directiveBindings.get(fullName)!.push(binding);
      }
    }

    // Call each directive handler once with all its bindings
    for (const [name, bindings] of directiveBindings) {
      const handler = Directives.get(name)!;
      this.bindDirective(handler, bindings);
    }
  }

  private bindEvent(eventName: string, handlerCode: string): void {
    const handler = (event: Event) => {
      try {
        const fn = new Function("event", "$event", "el", "$el", handlerCode);
        fn.call(this, event, event, this, this);
      } catch (err) {
        console.error(`[uizy] Error in :${eventName} handler:`, err);
      }
    };

    this.addEventListener(eventName, handler);
    this.cleanupFns.push(() => this.removeEventListener(eventName, handler));
  }

  private bindDirective(
    handler: (el: HTMLElement, ctx: DirectiveContext) => void,
    bindings: DirectiveBinding[]
  ): void {
    // Use first binding for primary value (backwards compatible)
    const primary = bindings[0];
    // Collect all args as modifiers for backwards compatibility
    const modifiers = bindings.map((b) => b.arg).filter(Boolean);

    const ctx: DirectiveContext = {
      value: primary.value,
      modifiers,
      expression: primary.value,
      bindings,
      effect: (fn) => {
        const cleanup = fn();
        if (cleanup) this.cleanupFns.push(cleanup);
      },
      cleanup: (fn) => this.cleanupFns.push(fn),
    };

    try {
      handler(this, ctx);
    } catch (err) {
      console.error(`[uizy] Error in directive:`, err);
    }
  }

  disconnectedCallback() {
    for (const cleanup of this.cleanupFns) {
      cleanup();
    }
    this.cleanupFns = [];
  }
}

/* ------------------------------------------------------------------ */
/* Registration & Initialization                                      */
/* ------------------------------------------------------------------ */

const COMPONENT_REGISTRY: [string, CustomElementConstructor][] = [
  ["uizy-app", UizyApp],
  ["uizy-system-bar", UizySystemBar],
  ["uizy-header", UizyHeader],
  ["uizy-footer", UizyFooter],
  ["uizy-overlay", UizyOverlay],
  ["uizy-main", UizyMain],
  ["uizy-drawer", UizyDrawer],
  ["uizy-box", UizyBox],
  ["uizy-toggle", UizyToggle],
];

export const initialize = (): void => {
  COMPONENT_REGISTRY.forEach(([name, ctor]) => {
    if (!customElements.get(name)) {
      customElements.define(name, ctor);
    }
  });
};

export {
  UizySystemBar,
  UizyHeader,
  UizyFooter,
  UizyOverlay,
  UizyMain,
  UizyDrawer,
  UizyBox,
  UizyToggle,
};
