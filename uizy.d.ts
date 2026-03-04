import type { JSX } from "preact";

// ============================================================================
// CORE TYPES
// ============================================================================

/** Nested structure for components, actions, and stores registration */
export type ComponentTree = Record<string, unknown>;

/** Handler function signature for actions */
export type ActionHandler = (payload?: unknown) => unknown;

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

/** Breakpoint configuration for responsive layout */
export interface BreakpointConfig {
  name: string;
  width: number;
  top: boolean;
  bottom: boolean;
  left: boolean;
  right: boolean;
  main: boolean;
  header: boolean;
  drawer: boolean;
}

/** Layout dimensions configuration */
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

/** Overlay appearance configuration */
export interface OverlayConfig {
  opacity: number;
  color: string;
}

/** Layout input for uizy.layout() and start config */
export interface LayoutInput {
  breakpoint?: Partial<BreakpointConfig>;
  layout?: Partial<LayoutConfig>;
  overlay?: Partial<OverlayConfig>;
}

/** System colors as key-value pairs */
export type SystemColors = Record<string, string>;

/** Scrollbar appearance options */
export interface ScrollbarOptions {
  size?: number;
  color?: string;
  hover?: string;
}

/** Brand color options */
export interface BrandOptions {
  name: string;
  back?: string;
  text?: string;
  line?: string;
}

/** Theme configuration */
export interface ThemeConfig {
  colors?: SystemColors;
  scrollbar?: ScrollbarOptions;
  brands?: BrandOptions[];
}

/** Plugin function signature */
export type PluginFn<T = unknown> = (app: UIZY, options?: T) => void;

/** Plugin can be a function or object with install method */
export type Plugin<T = unknown> = PluginFn<T> | { install: PluginFn<T> };

/** Exports provided by a plugin */
export interface PluginExports {
  components?: ComponentTree;
  actions?: ComponentTree;
  stores?: ComponentTree;
  directives?: DirectivesConfig;
}

/** Directives configuration map */
export type DirectivesConfig = Record<
  string,
  DirectiveHandler | ((el: HTMLElement) => void)
>;

/** Main configuration object for uizy.start() */
export interface StartConfig {
  layout?: LayoutInput;
  theme?: ThemeConfig;
  components?: ComponentTree;
  actions?: ComponentTree;
  stores?: ComponentTree;
  directives?: DirectivesConfig;
  globals?: boolean;
  plugins?: Array<Plugin | [Plugin, unknown]>;
  onReady?: () => void;
}

// ============================================================================
// REGISTRY INTERFACES
// ============================================================================

/** Options for registry calls */
export interface CallOptions {
  silent?: boolean;
}

/** Options for store calls */
export interface StoreCallOptions extends CallOptions {
  raw?: boolean;
}

/** Registry interface for components and actions */
export interface Registry {
  add<C extends ComponentTree>(items: C): Registry;
  call(path: string, args?: unknown, options?: CallOptions): unknown;
  has(path: string): boolean;
  paths(): string[];
  clear(): void;
  getTree(): Readonly<ComponentTree>;
}

/** Store registry interface */
export interface StoreRegistry {
  add<C extends ComponentTree>(items: C): StoreRegistry;
  call<T = unknown>(
    path: string,
    options?: StoreCallOptions
  ): T | NanoStore<T> | undefined;
  has(path: string): boolean;
  paths(): string[];
  clear(): void;
  getTree(): Readonly<ComponentTree>;
}

/** Directive registry interface */
export interface DirectiveRegistry {
  add(name: string, handler: DirectiveHandler): DirectiveRegistry;
  addAll(
    directives: Record<string, DirectiveHandler | ((el: HTMLElement) => void)>
  ): DirectiveRegistry;
  get(name: string): DirectiveHandler | undefined;
  has(name: string): boolean;
  names(): string[];
  clear(): void;
}

// ============================================================================
// STORE/STATE MANAGEMENT TYPES
// ============================================================================

/** NanoStore interface representing atom, map, computed, or deepMap */
export interface NanoStore<T = unknown> {
  get(): T;
  set?(value: T): void;
  setKey?<K extends keyof T>(key: K, value: T[K]): void;
  subscribe(callback: (value: T) => void): () => void;
  listen(callback: (value: T) => void): () => void;
}

/** Readable atom type for computed stores */
export interface ReadableAtom<T> {
  get(): T;
  subscribe(callback: (value: T) => void): () => void;
  listen(callback: (value: T) => void): () => void;
}

// ============================================================================
// DIRECTIVE TYPES
// ============================================================================

/** Directive binding information */
export interface DirectiveBinding {
  value: string;
  arg: string;
}

/** Context passed to directive handlers */
export interface DirectiveContext {
  value: string;
  modifiers: string[];
  expression: string;
  bindings: DirectiveBinding[];
  effect: (fn: () => (() => void) | void) => void;
  cleanup: (fn: () => void) => void;
}

/** Directive handler function signature */
export type DirectiveHandler = (el: HTMLElement, ctx: DirectiveContext) => void;

// ============================================================================
// THEME CLASS
// ============================================================================

/** Theme configuration class */
export interface ThemeClass {
  system(props: SystemColors): void;
  scrollbar(options: ScrollbarOptions): void;
  brand(options: BrandOptions): void;
  reset(): void;
  clear(): void;
  toCSS(): string;
}

// ============================================================================
// ERROR CLASSES
// ============================================================================

export class ComponentNotFoundError extends Error {
  constructor(path: string);
}

export class ActionNotFoundError extends Error {
  constructor(path: string);
}

export class StoreNotFoundError extends Error {
  constructor(path: string);
}

// ============================================================================
// MAIN UIZY API INTERFACE
// ============================================================================

/** Main UIZY API interface */
export interface UIZY {
  /** Library name */
  readonly __name__: string;
  /** Library version */
  readonly __version__: string;
  /** Library author */
  readonly __author__: string;

  // Configuration & Initialization
  /** Unified configuration method for setting up the entire framework */
  start(config: StartConfig): void;
  /** Initialize web components and run callback on DOM ready */
  init(callback?: () => void): void;
  /** Configure layout dimensions and breakpoints */
  layout(input: LayoutInput): void;

  // Element Access
  /** Get HTML element by ID */
  get(id: string): HTMLElement | null;

  // Component System
  /** Call registered components to get CSS classes */
  use(path: string | string[], props?: unknown): string;
  /** Register components */
  add(items: ComponentTree): Registry;
  /** Component registry */
  components: Registry;

  // Action System
  /** Call an action */
  emit(path: string, args?: unknown, options?: CallOptions): unknown;
  /** Register action handlers */
  on(items: ComponentTree): Registry;
  /** Action registry */
  actions: Registry;

  // State Management (Nanostores)
  /** Get store value by path */
  $<T = unknown>(
    path: string,
    options?: StoreCallOptions
  ): T | NanoStore<T> | undefined;
  /** Set entire store value */
  $set<T = unknown>(path: string, value: T): void;
  /** Update single key in map store */
  $key<T extends Record<string, unknown>, K extends keyof T>(
    path: string,
    key: K,
    value: T[K]
  ): void;
  /** Subscribe to store (immediate + updates) */
  $sub<T = unknown>(path: string, callback: (value: T) => void): () => void;
  /** Listen to store (changes only) */
  $on<T = unknown>(path: string, callback: (value: T) => void): () => void;
  /** Create computed store from multiple stores */
  $computed<T = unknown>(
    aliases: Record<string, string>,
    fn: (values: Record<string, unknown>) => T
  ): ReadableAtom<T>;
  /** Register stores */
  state(items: ComponentTree): StoreRegistry;
  /** Nanostores utilities */
  store: {
    atom<T>(initial: T): NanoStore<T>;
    map<T extends Record<string, unknown>>(initial?: T): NanoStore<T>;
    computed<T>(
      stores: NanoStore<unknown>[],
      fn: (...values: unknown[]) => T
    ): ReadableAtom<T>;
    deepMap<T extends Record<string, unknown>>(initial?: T): NanoStore<T>;
  };

  // Directives & Plugins
  /** Register custom directive */
  directive(name: string, handler: DirectiveHandler): DirectiveRegistry;
  /** Directives registry */
  directives: DirectiveRegistry;
  /** Register namespaced plugin */
  plugin(namespace: string, exports: PluginExports): void;

  // Theme
  /** Update theme configuration and inject CSS */
  theme(config: ThemeConfig): void;
  /** Theme class with static methods for advanced use */
  themeClass: ThemeClass;
}

// ============================================================================
// GLOBAL DECLARATIONS
// ============================================================================

declare global {
  /** Main UIZY API instance */
  const uizy: UIZY;

  interface Window {
    /** Main UIZY API instance */
    uizy: UIZY;
    /** Store accessor (available when globals: true) */
    $: UIZY["$"];
    /** Action emitter (available when globals: true) */
    $emit: UIZY["emit"];
  }
}

// ============================================================================
// WEB COMPONENT ATTRIBUTE TYPES
// ============================================================================

/** Base attributes for all uizy components */
type UizyBaseAttributes = JSX.HTMLAttributes<HTMLElement>;

/** Shadow level attribute (0-6) */
type ShadowAttribute =
  | "0"
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | number
  | string;

/** Clip attributes for layout clipping */
interface ClipAttributes {
  "clip-top"?: boolean;
  "clip-bottom"?: boolean;
  "clip-left"?: boolean;
  "clip-right"?: boolean;
  "clip-left-mini"?: boolean;
  "clip-right-mini"?: boolean;
  "clip-system"?: boolean;
}

/** Reactive binding attributes using colon prefix */
interface ReactiveBindings {
  /** Reactive text binding to store path */
  ":text"?: string;
  /** Alternative reactive text binding */
  "u-text"?: string;
  /** Event bindings */
  ":click"?: string;
  ":input"?: string;
  ":change"?: string;
  ":keydown"?: string;
  ":keyup"?: string;
  ":keypress"?: string;
  ":focus"?: string;
  ":blur"?: string;
  ":submit"?: string;
  ":reset"?: string;
  ":scroll"?: string;
  ":wheel"?: string;
  ":mousedown"?: string;
  ":mouseup"?: string;
  ":mouseover"?: string;
  ":mouseout"?: string;
  ":mousemove"?: string;
  ":mouseenter"?: string;
  ":mouseleave"?: string;
  ":contextmenu"?: string;
  ":dblclick"?: string;
  ":touchstart"?: string;
  ":touchend"?: string;
  ":touchmove"?: string;
  ":touchcancel"?: string;
  ":drag"?: string;
  ":dragstart"?: string;
  ":dragend"?: string;
  ":dragover"?: string;
  ":dragenter"?: string;
  ":dragleave"?: string;
  ":drop"?: string;
  ":pointerdown"?: string;
  ":pointerup"?: string;
  ":pointermove"?: string;
  ":pointerover"?: string;
  ":pointerout"?: string;
  ":pointerenter"?: string;
  ":pointerleave"?: string;
  ":pointercancel"?: string;
  ":animationstart"?: string;
  ":animationend"?: string;
  ":animationiteration"?: string;
  ":transitionstart"?: string;
  ":transitionend"?: string;
  ":transitionrun"?: string;
  ":transitioncancel"?: string;
  /** Allow custom directive bindings */
  [key: `:${string}`]: string | undefined;
  [key: `u-${string}`]: string | undefined;
}

/** ui-box specific attributes */
interface UiBoxAttributes {
  /** Apply registered components (space-separated paths) */
  use?: string;
  /** JSON object for component props */
  "use:props"?: string;
}

// ============================================================================
// PREACT JSX INTRINSIC ELEMENTS
// ============================================================================

declare module "preact" {
  namespace JSX {
    interface IntrinsicElements {
      // App Layout Container
      "uizy-app": UizyBaseAttributes;

      // System Bar
      "uizy-system-bar": UizyBaseAttributes;

      // Header
      "uizy-header": UizyBaseAttributes & {
        shadow?: ShadowAttribute;
      };

      // Footer
      "uizy-footer": UizyBaseAttributes & {
        shadow?: ShadowAttribute;
      };

      // Main Content Area
      "uizy-main": UizyBaseAttributes & ClipAttributes;

      // Drawer/Sidebar
      "uizy-drawer": UizyBaseAttributes &
        ClipAttributes & {
          open?: boolean;
          right?: boolean;
          left?: boolean;
          mini?: boolean;
          shadow?: ShadowAttribute;
        };

      // Overlay
      "uizy-overlay": UizyBaseAttributes & ClipAttributes;

      // Generic UI Box with reactive bindings
      "ui-box": UizyBaseAttributes & UiBoxAttributes & ReactiveBindings;
    }
  }
}

export {};
