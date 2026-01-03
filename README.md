# Uizy

<div align="center">

  <img height="140px" src="https://raw.githubusercontent.com/dufeutech/uizy/main/docs/static/img/logo.png" alt="logo"/>

   <p><strong>Small footprint, big impact – the micro CSS framework for UIs.</strong></p>
   <p><code>~6kb</code> gzipped JS + <code>~6.5kb</code> gzipped CSS</p>

[![License: BSD 3-Clause](https://img.shields.io/badge/License-BSD%203--Clause-blue.svg)](https://opensource.org/licenses/BSD-3-Clause)
[![npm version](https://img.shields.io/npm/v/@dufeutech/uizy.svg)](https://www.npmjs.com/package/@dufeutech/uizy)

[Documentation](https://dufeutech.github.io/uizy/) |
[GitHub](https://github.com/dufeutech/uizy)

</div>

## Installation

```bash
npm install @dufeutech/uizy
```

```js
import uizy from "@dufeutech/uizy";
import "@dufeutech/uizy/index.css";
```

Or via CDN:

```html
<script src="https://unpkg.com/@dufeutech/uizy/dist/uizy.iife.js"></script>
<link href="https://unpkg.com/@dufeutech/uizy/dist/index.css" rel="stylesheet" />
```

## Quick Start

```js
uizy.start({
  globals: true,
  layout: { layout: { header: 56, footer: 48, left: 240 } },
  theme: { colors: { primary: "#6b08a5", accent: "#1eadff" } },
  components: {
    button: () => "px-4 py-2 bd-a br-1 e-p e-ns",
  },
  stores: {
    counter: uizy.store.atom(0),
  },
  onReady: () => console.log("Ready!"),
});
```

```html
<style>
  uizy-header {
    background: var(--color-primary);
  }
  uizy-footer {
    background: var(--color-accent);
  }
</style>
<uizy-app>
  <uizy-header class="bd-a">Header</uizy-header>
  <uizy-drawer clip-top clip-bottom class="bd-a" open>Sidebar</uizy-drawer>
  <uizy-main clip-top clip-bottom clip-left class="pa-8 bd-a">
    <ui-box use="button" onclick="uizy.$set('counter', $('counter') + 1)"
      >Add +</ui-box
    >
    Count: <ui-box :text="counter"></ui-box>
  </uizy-main>
  <uizy-footer class="bd-a">Footer</uizy-footer>
</uizy-app>
```

## Features

- **Utility CSS** – Atomic classes for rapid styling
- **Web Components** – `<uizy-app>`, `<uizy-header>`, `<uizy-drawer>`, `<ui-box>`
- **Reactive State** – Built-in [nanostores](https://github.com/nanostores/nanostores) integration
- **Components & Actions** – Register reusable styles and event handlers
- **Directives** – Custom attributes with modifiers (`:tooltip.top="text"`)
- **Plugins** – Namespace and bundle related functionality
- **Responsive** – Mobile-first breakpoints (`sm`, `md`, `lg`, `xl`, `xxl`)

## License

BSD 3-Clause
