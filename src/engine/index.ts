/**
 * Uizy Engine
 *
 * Main entry point for the Uizy layout system and component registry.
 * Provides both granular APIs and a unified `start()` configuration method.
 *
 * @example
 * ```ts
 * import uizy from "@dufeut/uizy";
 *
 * // Option 1: Unified configuration
 * uizy.start({
 *   layout: { header: 56, footer: 48 },
 *   theme: { colors: { primary: "#1a1a1a" } },
 *   onReady: () => console.log("Ready!")
 * });
 *
 * // Option 2: Granular APIs
 * uizy.layout({ layout: { header: 56 } });
 * uizy.theme.system({ primary: "#1a1a1a" });
 * uizy.init(() => console.log("Ready!"));
 * ```
 */

import { initialize } from "./app.ts";
import { layout, type LayoutInput } from "./layout.ts";
import {
  Components,
  Actions,
  Stores,
  Directives,
  type ComponentTree,
  type DirectiveHandler,
} from "./components.ts";
import {
  Theme,
  type SystemColors,
  type ScrollbarOptions,
  type BrandOptions,
} from "./theme.ts";
import { injectCSS } from "./utils.ts";
import { $screen, startScreenListener } from "./screen.ts";

/* ------------------------------------------------------------------ */
/* Nano-Stores                                                        */
/* ------------------------------------------------------------------ */
import * as NanoStore from "nanostores";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

/** Theme configuration for the start() method */
export interface ThemeConfig {
  /** System color variables (primary, secondary, accent, etc.) */
  colors?: SystemColors;
  /** Scrollbar customization */
  scrollbar?: ScrollbarOptions;
  /** Brand color sets */
  brands?: BrandOptions[];
}

/** Directives configuration (simple or full handlers) */
export type DirectivesConfig = Record<
  string,
  DirectiveHandler | ((el: HTMLElement) => void)
>;

/** Plugin exports - what a plugin provides */
export interface PluginExports {
  /** Components to register under the namespace */
  components?: ComponentTree;
  /** Actions to register under the namespace */
  actions?: ComponentTree;
  /** Stores to register under the namespace */
  stores?: ComponentTree;
  /** Directives to register (prefixed with namespace) */
  directives?: DirectivesConfig;
}

/** Plugin function signature */
export type PluginFn<T = unknown> = (app: typeof UIZY, options?: T) => void;

/** Plugin definition (function or object with install method) */
export type Plugin<T = unknown> = PluginFn<T> | { install: PluginFn<T> };

/** Complete configuration for the start() method */
export interface StartConfig {
  /** Layout dimensions and breakpoint settings */
  layout?: LayoutInput;

  /** Theme configuration (colors, scrollbar, brands) */
  theme?: ThemeConfig;

  /** Components to register (nested tree structure) */
  components?: ComponentTree;

  /** Actions to register (nested tree structure) */
  actions?: ComponentTree;

  /** Stores to register (nested tree structure) */
  stores?: ComponentTree;

  /** Custom directives to register */
  directives?: DirectivesConfig;

  /** Inject global shortcuts to window ($ and $emit) */
  globals?: boolean;

  /** Plugins to install */
  plugins?: Array<Plugin | [Plugin, unknown]>;

  /** Callback to run when DOM is ready */
  onReady?: () => void;
}

/* ------------------------------------------------------------------ */
/* Plugin System                                                       */
/* ------------------------------------------------------------------ */

/** Set of installed plugins to prevent duplicates */
const installedPlugins = new WeakSet<object>();

/**
 * Installs a plugin by calling its function or install method.
 */
function installPlugin(plugin: Plugin, options?: unknown): void {
  // Use the function/object itself as the key for deduplication
  const pluginKey = typeof plugin === "function" ? plugin : plugin;

  if (installedPlugins.has(pluginKey)) {
    console.warn("[uizy] Plugin already installed, skipping");
    return;
  }

  installedPlugins.add(pluginKey);

  if (typeof plugin === "function") {
    plugin(UIZY, options);
  } else if (plugin && typeof plugin.install === "function") {
    plugin.install(UIZY, options);
  }
}

/**
 * Registers a namespaced plugin with components, actions, stores, and directives.
 *
 * @param namespace - The namespace prefix for all exports
 * @param exports - The plugin exports (components, actions, stores, directives)
 *
 * @example
 * ```ts
 * // In a plugin
 * function MyPlugin(app) {
 *   app.plugin("mylib", {
 *     components: {
 *       button: () => "px-4 py-2 rounded",
 *     },
 *     directives: {
 *       hover: (el, { value }) => { ... },
 *     },
 *   });
 * }
 *
 * // Usage after installing plugin:
 * // Components: uizy.use("mylib.button") or <ui-box use="mylib.button">
 * // Directives: <ui-box :mylib-hover="value">
 * ```
 */
function registerPlugin(namespace: string, exports: PluginExports): void {
  const { components, actions, stores, directives } = exports;

  // Register components under namespace
  if (components) {
    Components.add({ [namespace]: components });
  }

  // Register actions under namespace
  if (actions) {
    Actions.add({ [namespace]: actions });
  }

  // Register stores under namespace
  if (stores) {
    Stores.add({ [namespace]: stores });
  }

  // Register directives with namespace prefix (namespace-directiveName)
  if (directives) {
    for (const [name, handler] of Object.entries(directives)) {
      const prefixedName = `${namespace}-${name}`;
      Directives.add(prefixedName, handler as DirectiveHandler);
    }
  }
}

/* ------------------------------------------------------------------ */
/* Core Functions                                                      */
/* ------------------------------------------------------------------ */

/**
 * Initializes web components and optionally runs a callback on DOMContentLoaded.
 *
 * @param callback - Function to call when DOM is ready
 *
 * @example
 * ```ts
 * uizy.init(() => {
 *   const app = uizy.get("app");
 *   // Setup event handlers...
 * });
 * ```
 */
function init(callback?: () => void): void {
  // Initialize web components
  initialize();

  // Start reactive screen tracking
  startScreenListener();

  // Run callback on DOM ready
  if (callback && typeof callback === "function") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      // DOM already loaded
      callback();
    }
  }
}

/**
 * Unified configuration method for setting up Uizy.
 * Configures layout, theme, components, and initialization in one call.
 *
 * @param config - Complete configuration object
 *
 * @example
 * ```ts
 * uizy.start({
 *   // Layout configuration
 *   layout: {
 *     layout: {
 *       system: 24,
 *       header: 56,
 *       footer: 48,
 *       left: 240,
 *       right: 240,
 *       leftMini: 64,
 *       rightMini: 64,
 *       drawerSpeed: 0.2,
 *     },
 *     overlay: {
 *       opacity: 0.45,
 *       color: "black",
 *     },
 *     breakpoint: {
 *       name: "md",
 *       main: true,
 *       header: true,
 *       left: true,
 *       right: true,
 *     },
 *   },
 *
 *   // Theme configuration
 *   theme: {
 *     colors: {
 *       primary: "#1a1a1a",
 *       secondary: "#f5f5f5",
 *       accent: "#6b08a5",
 *       focus: "#1eadff",
 *       info: "#0050b9",
 *       success: "#28b77b",
 *       warning: "#f2c94c",
 *       danger: "#d64545",
 *       error: "#ff4d4d",
 *     },
 *     scrollbar: {
 *       size: 12,
 *       color: "rgba(121, 121, 121, 0.4)",
 *       hover: "rgba(121, 121, 121, 0.7)",
 *     },
 *     brands: [
 *       { name: "primary", back: "#6b08a5", text: "#fff" },
 *       { name: "success", back: "#28b77b", text: "#fff" },
 *     ],
 *   },
 *
 *   // Custom components
 *   components: {
 *       button: () => `px-4 py-2`,
 *       buttonWithConfig: (arg) => `px-${arg.x ?? 0} py-${arg.x ?? 0}`,
 *   },
 *
 *   // Ready callback
 *   onReady: () => {
 *     console.log("Uizy is ready!");
 *   },
 * });
 * ```
 */
declare const __APP_NAME__: string;
declare const __APP_VERSION__: string;
declare const __APP_AUTHOR__: string;

declare global {
  interface Window {
    uizy: typeof UIZY & {
      __name__: string;
      __version__: string;
      __author__: string;
    };
    /** Global store accessor (when globals: true) */
    $: typeof UIZY.$;
    /** Global action emitter (when globals: true) */
    $emit: typeof UIZY.emit;
  }
}

function start(config: StartConfig = {}): void {
  window.uizy = Object.freeze({
    __name__: __APP_NAME__,
    __version__: __APP_VERSION__,
    __author__: __APP_AUTHOR__,
    ...UIZY,
  });

  const {
    layout: layoutConfig,
    theme: themeConfig,
    components,
    actions,
    stores,
    directives,
    globals,
    plugins,
    onReady,
  } = config;

  // 0. Install plugins first (they may add components, actions, stores, directives)
  if (plugins && plugins.length > 0) {
    for (const pluginEntry of plugins) {
      if (Array.isArray(pluginEntry)) {
        // [Plugin, options] format
        const [plugin, options] = pluginEntry;
        installPlugin(plugin, options);
      } else {
        // Plugin only (no options)
        installPlugin(pluginEntry);
      }
    }
  }

  // 1. Configure layout
  if (layoutConfig) {
    layout(layoutConfig);
  }

  // 2. Configure theme
  if (themeConfig) {
    // System colors
    if (themeConfig.colors) {
      Theme.system(themeConfig.colors);
    }

    // Scrollbar
    if (themeConfig.scrollbar) {
      Theme.scrollbar(themeConfig.scrollbar);
    }

    // Brand colors
    if (themeConfig.brands && themeConfig.brands.length > 0) {
      for (const brand of themeConfig.brands) {
        Theme.brand(brand);
      }
    }

    // Inject theme CSS into document
    const themeCSS = Theme.toCSS();
    if (themeCSS) {
      injectCSS(`:root { ${themeCSS} }`, "theme");
    }
  }

  // 3. Register components
  if (components) {
    Components.add(components);
  }

  // 4. Register actions
  if (actions) {
    Actions.add(actions);
  }

  // 5. Register stores
  if (stores) {
    Stores.add(stores);
  }

  // 6. Register directives
  if (directives) {
    Directives.addAll(directives);
  }

  // 7. Inject global shortcuts
  if (globals) {
    window.$ = UIZY.$;
    window.$emit = UIZY.emit;
  }

  // 8. Initialize and run callback
  init(onReady);
}

/* ------------------------------------------------------------------ */
/* UIZY API                                                            */
/* ------------------------------------------------------------------ */

/**
 * Main Uizy API object.
 *
 * Provides access to all Uizy functionality:
 * - `start()` - Unified configuration
 * - `init()` - Initialize web components
 * - `layout()` - Configure layout dimensions
 * - `theme` - Theme configuration class
 * - `components` - Component registry class
 * - `actions` - Action registry class
 * - `get()` - Get element by ID
 * - `use()` - Call a registered component
 * - `add()` - Register components
 * - `on()` - Register action handlers
 * - `emit()` - Call an action
 * - `store` - Nanostores utilities (atom, map, computed)
 * - `$()` - Get store value
 * - `$set()` - Set store value
 * - `$key()` - Set single key in map store
 * - `$sub()` - Subscribe to store (immediate + changes)
 * - `$on()` - Listen to store (changes only)
 * - `$computed()` - Create computed store from multiple stores with aliases
 * - `directive()` - Register a custom directive
 * - `plugin()` - Register a namespaced plugin
 */
const UIZY = {
  /** Unified configuration method */
  start,

  /** Initialize web components and run callback on DOM ready */
  init,

  /** Configure layout dimensions, breakpoints, and overlay */
  layout,

  /** Get an element by ID */
  get: (id: string): HTMLElement | null => document.getElementById(id),

  /** Theme configuration class (static methods) */
  themeClass: Theme,

  /**
   * Updates theme configuration and injects CSS.
   * Can be called multiple times to update specific theme aspects.
   *
   * @param config - Partial theme configuration to apply
   *
   * @example
   * ```ts
   * // Update colors only
   * uizy.theme({ colors: { primary: "#ff0000" } });
   *
   * // Update scrollbar only
   * uizy.theme({ scrollbar: { size: 10 } });
   *
   * // Update multiple aspects
   * uizy.theme({
   *   colors: { accent: "#6b08a5" },
   *   brands: [{ name: "info", back: "#0050b9", text: "#fff" }],
   * });
   * ```
   */
  theme: (config: ThemeConfig): void => {
    if (config.colors) Theme.system(config.colors);
    if (config.scrollbar) Theme.scrollbar(config.scrollbar);
    if (config.brands) {
      for (const brand of config.brands) Theme.brand(brand);
    }
    const css = Theme.toCSS();
    if (css) injectCSS(`:root { ${css} }`, "theme");
  },

  /** Component registry class */
  components: Components,

  /** Action registry class */
  actions: Actions,

  /** Nano-Stores utilities */
  store: NanoStore,

  /**
   * Call registered component(s) by path.
   * Supports single path or array of paths with shared props.
   *
   * Components can return:
   * - string: "px-4 py-2"
   * - array: ["px-4", "py-2"]
   * - object: { "px-4 py-2": true, "bg-red": false } (only truthy keys included)
   *
   * @example
   * ```ts
   * // Single component
   * uizy.use("button.primary");
   * uizy.use("button.primary", { size: "lg" });
   *
   * // Multiple components (classes are combined)
   * uizy.use(["button.base", "button.primary"]);
   * uizy.use(["button.base", "button.primary"], { size: "lg" });
   *
   * // Component returning conditional classes
   * // button: (props) => ({ "px-4": props.size === "md", "px-8": props.size === "lg" })
   * uizy.use("button", { size: "lg" }); // "px-8"
   * ```
   */
  use: (path: string | string[], props?: unknown): string => {
    const _props = props ?? {};

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

    if (typeof path === "string") {
      const result = Components.call(path, _props);
      return extractClasses(result).join(" ");
    }

    // Array of paths - combine all results
    const allClasses: string[] = [];
    for (const p of path) {
      if (!Components.has(p)) continue;
      const result = Components.call(p, _props);
      allClasses.push(...extractClasses(result));
    }
    return allClasses.join(" ");
  },

  /** Register components */
  add: Components.add.bind(Components),

  /** Register action handlers */
  on: Actions.add.bind(Actions),

  /** Call an action */
  emit: Actions.call.bind(Actions),

  /** Get store value by path */
  $: Stores.call.bind(Stores),

  /** Set store value: uizy.$set("path", value) */
  $set: <T>(path: string, value: T): void => {
    const store = Stores.call<T>(path, { raw: true }) as
      | { set?: (v: T) => void }
      | undefined;
    store?.set?.(value);
  },

  /** Update a single key in a map store: uizy.$key("path", "key", value) */
  $key: <T, K extends keyof T>(path: string, key: K, value: T[K]): void => {
    const store = Stores.call<T>(path, { raw: true }) as
      | { setKey?: (k: K, v: T[K]) => void }
      | undefined;
    store?.setKey?.(key, value);
  },

  /** Subscribe to store changes (immediate + updates): uizy.$sub("path", callback) */
  $sub: <T>(path: string, callback: (value: T) => void): (() => void) => {
    const store = Stores.call<T>(path, { raw: true }) as
      | { subscribe?: (cb: (v: T) => void) => () => void }
      | undefined;
    return store?.subscribe?.(callback) ?? (() => {});
  },

  /** Listen to store changes (updates only): uizy.$on("path", callback) */
  $on: <T>(path: string, callback: (value: T) => void): (() => void) => {
    const store = Stores.call<T>(path, { raw: true }) as
      | { listen?: (cb: (v: T) => void) => () => void }
      | undefined;
    return store?.listen?.(callback) ?? (() => {});
  },

  /**
   * Create a computed store from multiple stores with aliases.
   * Store paths are resolved lazily on first access, allowing use during registration.
   *
   * @param aliases - Object mapping alias names to store paths
   * @param fn - Function that receives resolved values by alias and returns computed value
   * @returns A nanostore computed store
   *
   * @example
   * ```ts
   * const $greeting = uizy.$computed(
   *   { name: "user.name", date: "app.today" },
   *   ({ name, date }) => `Hello ${name}, today is ${date}`
   * );
   *
   * // Use like any other store
   * $greeting.get();           // "Hello John, today is Monday"
   * $greeting.subscribe(cb);   // Subscribe to changes
   * ```
   */
  $computed: <T, A extends Record<string, string>>(
    aliases: A,
    fn: (values: { [K in keyof A]: unknown }) => T
  ): NanoStore.ReadableAtom<T> => {
    const entries = Object.entries(aliases);
    let resolvedStores: NanoStore.ReadableAtom<unknown>[] | null = null;
    let computedStore: NanoStore.ReadableAtom<T> | null = null;

    // Lazily resolve stores and create computed on first access
    const ensureComputed = (): NanoStore.ReadableAtom<T> => {
      if (computedStore) return computedStore;

      resolvedStores = entries.map(([alias, path]) => {
        const store = Stores.call(path, { raw: true });
        if (!store) {
          throw new Error(
            `[uizy] Store not found: "${path}" (alias: "${alias}")`
          );
        }
        return store as NanoStore.ReadableAtom<unknown>;
      });

      computedStore = NanoStore.computed(resolvedStores, (...values) => {
        const aliasedValues = {} as { [K in keyof A]: unknown };
        entries.forEach(([alias], index) => {
          aliasedValues[alias as keyof A] = values[index];
        });
        return fn(aliasedValues);
      });

      return computedStore;
    };

    // Return a lazy proxy that matches ReadableAtom interface
    return {
      get: () => ensureComputed().get(),
      subscribe: (cb: (value: T) => void) => ensureComputed().subscribe(cb),
      listen: (cb: (value: T) => void) => ensureComputed().listen(cb),
    } as NanoStore.ReadableAtom<T>;
  },

  /** Register stores */
  state: Stores.add.bind(Stores),

  /** Register a custom directive */
  directive: Directives.add.bind(Directives),

  /** Directives registry */
  directives: Directives,

  /** Register a namespaced plugin */
  plugin: registerPlugin,

  /** Reactive screen store: { width, size } */
  screen: $screen,
} as const;

/* ------------------------------------------------------------------ */
/* Exports                                                             */
/* ------------------------------------------------------------------ */

export default UIZY;

// Re-export types from other modules for external use
export type {
  LayoutInput,
  BreakpointConfig,
  LayoutConfig,
  OverlayConfig,
} from "./layout.ts";

export type { ScreenState } from "./screen.ts";

export type { SystemColors, ScrollbarOptions, BrandOptions } from "./theme.ts";

export type {
  ComponentTree,
  ActionHandler,
  NanoStore,
  DirectiveHandler,
  DirectiveContext,
} from "./components.ts";

// Note: Plugin types (PluginExports, PluginFn, Plugin, StartConfig, ThemeConfig, DirectivesConfig)
// are already exported via their interface/type definitions above
