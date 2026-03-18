/**
 * Registry System
 *
 * Provides registries for managing callable functions and reactive stores:
 * - **Components**: Nested component trees (UI elements, services)
 * - **Actions**: Nested action handlers (events, commands)
 * - **Stores**: Nanostore instances (reactive state)
 *
 * @example
 * ```ts
 * // Components: nested structure for UI elements
 * Components.add({
 *   drawer: { left: { open: () => {}, close: () => {} } }
 * });
 * Components.call("drawer.left.open");
 *
 * // Actions: nested handlers for events
 * Actions.add({
 *   user: { login: (data) => authenticate(data) }
 * });
 * Actions.call("user.login", { email, password });
 *
 * // Stores: nanostore instances
 * Stores.add({ user: { name: uizy.store.atom("john") } });
 * uizy.$("user.name"); // "john"
 * ```
 */

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

/** Nested tree structure for components/actions/stores */
export type ComponentTree = Record<string, unknown>;

/** Action handler function signature */
export type ActionHandler = (payload?: unknown) => unknown;

/** Call options */
export interface CallOptions {
  silent?: boolean;
}

/** Store call options */
export interface StoreCallOptions extends CallOptions {
  /** Return the raw store object instead of its value */
  raw?: boolean;
}

/** Registry interface */
export interface Registry {
  add<C extends ComponentTree>(items: C): Registry;
  call(path: string, args?: unknown, options?: CallOptions): unknown;
  has(path: string): boolean;
  paths(): string[];
  clear(): void;
  getTree(): Readonly<ComponentTree>;
}

/* ------------------------------------------------------------------ */
/* Path Resolution                                                     */
/* ------------------------------------------------------------------ */

/** Resolves dot-notation path to value */
const resolvePath = (root: ComponentTree, path: string): unknown => {
  let current: unknown = root;
  for (const segment of path.split(".")) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
};

/* ------------------------------------------------------------------ */
/* Registry Errors                                                     */
/* ------------------------------------------------------------------ */

class RegistryError extends Error {
  readonly type: string;
  readonly path: string;

  constructor(type: string, path: string) {
    super(`${type} not found: "${path}"`);
    this.name = `${type}NotFoundError`;
    this.type = type;
    this.path = path;
  }
}

export class ComponentNotFoundError extends RegistryError {
  constructor(path: string) {
    super("Component", path);
  }
}

export class ActionNotFoundError extends RegistryError {
  constructor(path: string) {
    super("Action", path);
  }
}

export class StoreNotFoundError extends RegistryError {
  constructor(path: string) {
    super("Store", path);
  }
}

/* ------------------------------------------------------------------ */
/* Utilities                                                           */
/* ------------------------------------------------------------------ */

/** Nanostore-like object for type checking */
interface NanoStoreLike {
  get(): unknown;
  subscribe(cb: (value: unknown) => void): () => void;
}

/** Type guard for nanostore objects (atom, map, computed, deepMap) */
const isNanoStore = (value: unknown): value is NanoStoreLike =>
  value != null &&
  typeof value === "object" &&
  "get" in value &&
  "subscribe" in value &&
  typeof (value as NanoStoreLike).get === "function" &&
  typeof (value as NanoStoreLike).subscribe === "function";

/** Extracts paths leading to functions */
const flattenFunctions = (obj: ComponentTree): string[] => {
  const result: string[] = [];
  const walk = (current: unknown, prefix: string): void => {
    if (current == null) return;
    if (typeof current === "function") {
      result.push(prefix);
      return;
    }
    if (typeof current === "object") {
      for (const [key, value] of Object.entries(current as object)) {
        walk(value, prefix ? `${prefix}.${key}` : key);
      }
    }
  };
  walk(obj, "");
  return result;
};

/** Extracts paths leading to nanostores */
const flattenStores = (obj: ComponentTree): string[] => {
  const result: string[] = [];
  const walk = (current: unknown, prefix: string): void => {
    if (current == null) return;
    if (isNanoStore(current)) {
      result.push(prefix);
      return;
    }
    if (typeof current === "object") {
      for (const [key, value] of Object.entries(current as object)) {
        walk(value, prefix ? `${prefix}.${key}` : key);
      }
    }
  };
  walk(obj, "");
  return result;
};

/* ------------------------------------------------------------------ */
/* Base Registry Factory                                               */
/* ------------------------------------------------------------------ */

type ErrorFactory = (path: string) => Error;

interface RegistryState {
  root: ComponentTree;
  cache: Map<string, unknown>;
}

function createRegistry(errorFactory: ErrorFactory): Registry {
  const state: RegistryState = { root: {}, cache: new Map() };

  return {
    add<C extends ComponentTree>(items: C): Registry {
      Object.assign(state.root, items);
      state.cache.clear();
      return this;
    },

    call(path: string, args?: unknown, options: CallOptions = {}): unknown {
      let method = state.cache.get(path);
      if (method === undefined && !state.cache.has(path)) {
        method = resolvePath(state.root, path);
        state.cache.set(path, method);
      }

      if (typeof method === "function") return method(args);
      if (options.silent) return undefined;
      throw errorFactory(path);
    },

    has: (path: string) => typeof resolvePath(state.root, path) === "function",
    paths: () => flattenFunctions(state.root),
    clear() {
      state.root = {};
      state.cache.clear();
    },
    getTree: () => state.root as Readonly<ComponentTree>,
  };
}

/* ------------------------------------------------------------------ */
/* Components Registry                                                 */
/* ------------------------------------------------------------------ */

/**
 * Registry for nested UI elements and services.
 * @example
 * ```ts
 * Components.add({ modal: { open: () => {}, close: () => {} } });
 * Components.call("modal.open");
 * ```
 */
export const Components: Registry = createRegistry(
  (p) => new ComponentNotFoundError(p)
);

/* ------------------------------------------------------------------ */
/* Actions Registry                                                    */
/* ------------------------------------------------------------------ */

/**
 * Registry for event handlers and commands.
 * @example
 * ```ts
 * Actions.add({ user: { login: (data) => auth(data) } });
 * Actions.call("user.login", credentials);
 * ```
 */
export const Actions: Registry = createRegistry(
  (p) => new ActionNotFoundError(p)
);

/* ------------------------------------------------------------------ */
/* Stores Registry                                                     */
/* ------------------------------------------------------------------ */

/**
 * Nanostore interface - supports atom, map, computed, and deepMap.
 *
 * All nanostores provide:
 * - `get()` - returns current value
 * - `subscribe(cb)` - calls callback immediately with current value, then on every change
 * - `listen(cb)` - calls callback only on changes (not immediately)
 *
 * Atoms additionally provide:
 * - `set(value)` - replaces the entire value
 *
 * Maps additionally provide:
 * - `set(value)` - replaces the entire object
 * - `setKey(key, value)` - updates a single property
 *
 * @see https://github.com/nanostores/nanostores
 */
export interface NanoStore<T = unknown> {
  /** Returns the current value */
  get(): T;
  /** Replaces the store value (atom, map) */
  set?(value: T): void;
  /** Updates a single key in the store (map only) */
  setKey?<K extends keyof T>(key: K, value: T[K]): void;
  /** Subscribes to changes - calls callback immediately with current value, then on every change. Returns unsubscribe function. */
  subscribe(callback: (value: T) => void): () => void;
  /** Listens for changes - calls callback only when value changes (not immediately). Returns unsubscribe function. */
  listen(callback: (value: T) => void): () => void;
}

/** Store registry interface */
export interface StoreRegistry {
  add<C extends ComponentTree>(items: C): StoreRegistry;
  call<T = unknown>(path: string, options?: StoreCallOptions): T | NanoStore<T> | undefined;
  has(path: string): boolean;
  paths(): string[];
  clear(): void;
  getTree(): Readonly<ComponentTree>;
}

const storesState: RegistryState = { root: {}, cache: new Map() };

/**
 * Registry for nanostores (atom, map, computed, deepMap).
 *
 * Supports all nanostore types:
 * - **atom** - single value store
 * - **map** - object store with setKey()
 * - **computed** - derived/calculated store
 * - **deepMap** - nested object store
 *
 * @example
 * ```ts
 * // === REGISTER STORES ===
 * uizy.state({
 *   user: {
 *     name: uizy.store.atom("john"),
 *     profile: uizy.store.map({ age: 25, city: "NYC" }),
 *   },
 *   // Computed store (derived from other stores)
 *   greeting: uizy.store.computed($name, name => `Hello, ${name}!`)
 * });
 *
 * // === GET CURRENT VALUE ===
 * uizy.$("user.name");           // "john"
 * uizy.$("user.profile");        // { age: 25, city: "NYC" }
 *
 * // === GET RAW STORE (for mutations & subscriptions) ===
 * const $name = uizy.$("user.name", { raw: true });
 *
 * // Atom: set entire value
 * $name.set("jane");
 *
 * // Map: set entire object or single key
 * const $profile = uizy.$("user.profile", { raw: true });
 * $profile.set({ age: 30, city: "LA" });  // Replace entire object
 * $profile.setKey("age", 31);              // Update single key
 *
 * // === SUBSCRIBE (immediate + changes) ===
 * const unsubscribe = $name.subscribe(value => {
 *   console.log("Current name:", value);  // Called immediately with "jane"
 * });
 * $name.set("bob");  // Logs: "Current name: bob"
 * unsubscribe();     // Stop listening
 *
 * // === LISTEN (changes only) ===
 * const unlisten = $name.listen(value => {
 *   console.log("Name changed to:", value);  // NOT called immediately
 * });
 * $name.set("alice");  // Logs: "Name changed to: alice"
 * unlisten();          // Stop listening
 * ```
 */
export const Stores: StoreRegistry = {
  add<C extends ComponentTree>(items: C): StoreRegistry {
    Object.assign(storesState.root, items);
    storesState.cache.clear();
    return Stores;
  },

  call<T = unknown>(path: string, options: StoreCallOptions = {}): T | NanoStore<T> | undefined {
    let store = storesState.cache.get(path);
    if (store === undefined && !storesState.cache.has(path)) {
      store = resolvePath(storesState.root, path);
      storesState.cache.set(path, store);
    }

    if (store == null) {
      if (options.silent) return undefined;
      throw new StoreNotFoundError(path);
    }

    // Return raw store for direct access to set/listen/subscribe
    if (options.raw) return store as NanoStore<T>;

    // Return current value if it's a nanostore
    if (isNanoStore(store)) {
      return store.get() as T;
    }

    return store as T;
  },

  has: (path: string) => {
    const value = resolvePath(storesState.root, path);
    return value !== undefined && isNanoStore(value);
  },

  paths: () => flattenStores(storesState.root),

  clear() {
    storesState.root = {};
    storesState.cache.clear();
  },

  getTree: () => storesState.root as Readonly<ComponentTree>,
};

/* ------------------------------------------------------------------ */
/* Directives Registry                                                 */
/* ------------------------------------------------------------------ */

/** Single binding from an attribute (e.g., :foo:one="value") */
export interface DirectiveBinding {
  /** The attribute value */
  value: string;
  /** The first modifier / argument (e.g., "one" from :foo:one) */
  arg: string;
}

/** Context passed to directive handlers */
export interface DirectiveContext {
  /** The attribute value from the first/primary binding */
  value: string;
  /** Modifiers from the first/primary binding */
  modifiers: string[];
  /** The raw expression string */
  expression: string;
  /** All bindings for this directive (when multiple :foo:* attributes exist) */
  bindings: DirectiveBinding[];
  /** Register a reactive effect (auto-cleaned on disconnect) */
  effect: (fn: () => (() => void) | void) => void;
  /** Register a cleanup function (called on disconnect) */
  cleanup: (fn: () => void) => void;
}

/** Directive handler function */
export type DirectiveHandler = (el: HTMLElement, ctx: DirectiveContext) => void;

/** Simple directive handler (just element) */
export type SimpleDirectiveHandler = (el: HTMLElement) => void;

/** Directive registry interface */
export interface DirectiveRegistry {
  /** Register a single directive */
  add(name: string, handler: DirectiveHandler): DirectiveRegistry;
  /** Register multiple directives from an object */
  addAll(directives: Record<string, DirectiveHandler | SimpleDirectiveHandler>): DirectiveRegistry;
  /** Get a directive handler by name */
  get(name: string): DirectiveHandler | undefined;
  /** Check if a directive exists */
  has(name: string): boolean;
  /** List all directive names */
  names(): string[];
  /** Clear all directives */
  clear(): void;
}

const directivesMap = new Map<string, DirectiveHandler>();

/**
 * Registry for custom directives.
 *
 * Directives are custom attributes that can be applied to uizy-box elements.
 * They receive the element and a context object with utilities for reactive effects.
 *
 * @example
 * ```ts
 * // Register a simple directive
 * uizy.directive("highlight", (el, { value }) => {
 *   el.style.backgroundColor = value || "yellow";
 * });
 *
 * // Usage: <uizy-box :highlight="red">Highlighted</uizy-box>
 *
 * // Register a directive with modifiers
 * uizy.directive("tooltip", (el, { value, modifiers }) => {
 *   const position = modifiers.includes("top") ? "top" : "bottom";
 *   // Setup tooltip...
 * });
 *
 * // Usage: <uizy-box :tooltip.top="Help text">Hover me</uizy-box>
 *
 * // Register a reactive directive
 * uizy.directive("bind", (el, { value, effect }) => {
 *   effect(() => {
 *     const store = Stores.call(value, { raw: true });
 *     return store?.subscribe((v) => {
 *       el.textContent = String(v);
 *     });
 *   });
 * });
 * ```
 */
export const Directives: DirectiveRegistry = {
  add(name: string, handler: DirectiveHandler): DirectiveRegistry {
    directivesMap.set(name, handler);
    return Directives;
  },

  addAll(directives: Record<string, DirectiveHandler | SimpleDirectiveHandler>): DirectiveRegistry {
    for (const [name, handler] of Object.entries(directives)) {
      // Wrap simple handlers to match full signature
      const fullHandler: DirectiveHandler = handler.length === 1
        ? (el) => (handler as SimpleDirectiveHandler)(el)
        : handler as DirectiveHandler;
      directivesMap.set(name, fullHandler);
    }
    return Directives;
  },

  get: (name: string) => directivesMap.get(name),

  has: (name: string) => directivesMap.has(name),

  names: () => Array.from(directivesMap.keys()),

  clear: () => directivesMap.clear(),
};

