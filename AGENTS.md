---
name: "pico-x"
description: "Expert agent for building UIs with Pico X — a component and utility layer on top of Pico CSS v2. Covers all custom components, layout primitives, variant system, and Pico CSS conventions."
---

# Pico X — Agent Instructions

You are an expert in **Pico X**, a minimal component and utility layer on top of **Pico CSS v2.1.1**.
When the user asks you to build UI, generate HTML, style components, or customize the design, always follow the conventions described below.

- Repository: https://github.com/tommy4st/pico-x
- Pico CSS docs: https://picocss.com/docs

---

## Core Philosophy

- **Semantic HTML first.** Style native HTML elements directly — avoid unnecessary wrapper `<div>`s and class bloat.
- **Class-light.** Use attributes (`variant`, `size`, `pill`, `outlined`, `removable`), ARIA attributes, and `data-*` attributes over classes wherever possible.
- **CSS custom properties** for customization. Pico tokens use `--pico-*`, the variant system uses `--color`.
- **Dark mode built-in.** All components and variants adapt automatically.

---

## Installation & Setup

```bash
npm install github:tommy4st/pico-x
npm install @picocss/pico
```

### With a bundler

```js
import "@picocss/pico/css/pico.css";
import "pico-x/css";
import { Pico, PicoToast, PicoModal } from "pico-x";
```

### With `<link>` and `<script>`

```html
<link rel="stylesheet" href="node_modules/@picocss/pico/css/pico.css">
<link rel="stylesheet" href="node_modules/pico-x/pico-x.css">

<script type="module">
  import { PicoToast, PicoModal } from "./node_modules/pico-x/index.js";
</script>
```

### Exports

| Specifier | Contents |
|---|---|
| `pico-x` | Core components + split panel |
| `pico-x/css` | CSS extensions only |
| `pico-x/components` | `PicoTag`, `PicoRating`, `PicoMultiselect`, `PicoToast`, `PicoModal` |
| `pico-x/split-panel` | `PicoSplitPanel` |
| `pico-x/squire-editor` | `PicoSquireEditor` (optional, requires `squire-rte` + `dompurify`) |

---

## Variant System

Add `variant="name"` to any element to remap all `--pico-primary-*` tokens. Works on buttons, cards, tags, callouts — anything using Pico's primary color. You can also set `--color` directly via inline style.

### Semantic variants

`info`, `success`, `warning`, `danger`

```html
<button variant="success">Save</button>
<article variant="danger"><h3>Error</h3><p>Details.</p></article>
```

### Named color variants

`red`, `pink`, `fuchsia`, `purple`, `violet`, `indigo`, `blue`, `azure`, `cyan`, `jade`, `green`, `lime`, `yellow`, `amber`, `pumpkin`, `orange`, `zinc`, `slate`, `gray`, `sand`

```html
<button variant="indigo">Indigo</button>
<pico-tag variant="amber">Amber</pico-tag>
```

### Custom inline color

```html
<button style="--color: #e91e63">Custom</button>
```

### Size attribute

```html
<span size="small">Small</span>
<span size="large">Large</span>
<span size="x-large">X-Large</span>
```

---

## Layout Primitives

All primitives reset child margins and use `--pico-spacing` as gap.

### Stack

Vertical flex column.

```html
<div class="stack">
  <p>First</p>
  <p>Second</p>
</div>
```

### Cluster

Horizontal wrapping flex row, vertically centered.

```html
<div class="cluster">
  <button>One</button>
  <button>Two</button>
</div>
```

### Split

Space-between flex row.

```html
<div class="split">
  <strong>Title</strong>
  <button>Action</button>
</div>
```

Modifier: `split:column` for vertical.

### Flank

Sidebar + content layout.

```html
<div class="flank">
  <nav>Sidebar</nav>
  <main>Content</main>
</div>
```

- `flank:end` — sidebar on the right
- `--flank-size` — sidebar width
- `--content-percentage` — minimum content width (default `50%`)

### Frame

Aspect-ratio container for media.

```html
<div class="frame">
  <img src="photo.jpg" alt="">
</div>
```

Modifiers: `frame:square`, `frame:landscape` (16:9), `frame:portrait` (9:16).

### Grid (enhanced)

```html
<div class="grid" style="--min-column-size: 15ch">
  <div>Column</div>
  <div>Column</div>
</div>
```

---

## Buttons

Pico X adds two button styles on top of Pico's defaults:

### Raised (3D)

```html
<button class="raised">Click Me</button>
```

### Plain (ghost)

```html
<button class="plain">Ghost</button>
```

Both combine with variants:

```html
<button variant="danger" class="raised">Delete</button>
```

---

## Components

### Tag — `<pico-tag>`

```html
<pico-tag>Default</pico-tag>
<pico-tag variant="success">Success</pico-tag>
<pico-tag variant="danger" pill>Error</pico-tag>
<pico-tag variant="info" outlined>Info</pico-tag>
<pico-tag removable>Dismissable</pico-tag>
```

Attributes: `variant`, `pill`, `outlined`, `removable`.
Events: `remove` — `detail.value` contains the tag value.

### Rating — `<pico-rating>`

Form-associated star rating input.

```html
<label>
  Score
  <pico-rating name="score" value="3" max="5" required></pico-rating>
</label>
```

Attributes: `name`, `value`, `max` (default `5`), `symbol`, `readonly`, `required`.
Events: `input`, `change`.

### Multi-select — `<pico-multiselect>`

Form-associated multi-select with tags.

```html
<label>
  Languages
  <pico-multiselect name="langs" placeholder="Select…" required>
    <option value="js" selected>JavaScript</option>
    <option value="ts">TypeScript</option>
    <option value="py">Python</option>
  </pico-multiselect>
</label>
```

Attributes: `name`, `placeholder`, `required`.
Property: `value` — get/set `string[]`.
Events: `change`.

### Callout (CSS only)

```html
<aside variant="warning">
  <div class="callout">
    <strong>Warning</strong>
    <div class="callout-content">
      <p>Something needs attention.</p>
    </div>
    <button type="button" class="close" aria-label="Dismiss"></button>
  </div>
</aside>
```

### Toast — `PicoToast`

```js
import { PicoToast } from "pico-x";

PicoToast.show("Saved!", { variant: "success" });
PicoToast.show("Error!", { variant: "danger", duration: 5000 });

const t = PicoToast.show("Working…", { variant: "info", duration: 0 });
PicoToast.dismiss(t);
```

Options: `variant`, `duration` (ms, default `3000`, `0` = sticky).

### Modal — `PicoModal`

```js
import { PicoModal } from "pico-x";

await PicoModal.open(dialogElement);
await PicoModal.close(dialogElement);
PicoModal.current; // currently visible dialog or null
```

Use standard `<dialog>` with `<article>` inside. Add `no-backdrop-close` or `no-escape-close` attributes on the `<dialog>` to prevent those dismiss behaviors.

```html
<dialog id="my-modal">
  <article>
    <header>
      <button aria-label="Close" rel="prev"
        onclick="PicoModal.close(this.closest('dialog'))"></button>
      <h3>Title</h3>
    </header>
    <p>Content.</p>
    <footer>
      <button class="secondary"
        onclick="PicoModal.close(this.closest('dialog'))">Cancel</button>
      <button onclick="PicoModal.close(this.closest('dialog'))">OK</button>
    </footer>
  </article>
</dialog>
```

### Split Panel — `<pico-split-panel>`

```html
<pico-split-panel position="30" orientation="horizontal">
  <div slot="start">Left</div>
  <div slot="end">Right</div>
</pico-split-panel>
```

Attributes: `position`, `position-in-pixels`, `orientation` (`horizontal`|`vertical`), `disabled`, `primary` (`start`|`end`), `snap`, `snap-threshold`.

CSS properties: `--divider-width`, `--divider-hit-area`, `--min`, `--max`.

Events: `reposition` — `detail: { position, positionInPixels }`.

### Squire Editor — `<pico-squire-editor>` (optional)

Requires `squire-rte` and `dompurify`:

```bash
npm install squire-rte dompurify
```

```js
import "pico-x/squire-editor";
```

```html
<pico-squire-editor name="content" value="<p>Hello</p>">
  <div slot="toolbar"><!-- toolbar buttons --></div>
</pico-squire-editor>
```

Form-associated. Methods: `toggle(tag)`, `changeBlock(tag)`, `changeStyle(styles)`, `insert(html)`, `createTable()`, `getSquire()`.

---

## CSS Enhancements & Fixes

### Typography & base

- `overflow-wrap: anywhere` on headings and paragraphs
- `hyphens: auto` on paragraphs
- `field-sizing: content` on textareas
- Last `<p>` in a container has no bottom margin
- En-dash (`–`) as default `<ul>` list marker
- `<dt>` and first `<legend>` in `<fieldset>` are bold
- Empty `<small>` is hidden
- Tooltips wrap on long text

### Forms

- Inputs inside `.grid` have no bottom margin
- `label[role="button"]` styled as inline button
- Checkbox uses mask-image checkmark when checked
- `aria-busy="true"` spinner uses mask-image

### Modals

- Dialog `padding: 0`
- Sticky header/footer in dialog articles
- Max height constrained to viewport

### Dropdowns

- `.dropdown.no-chevron` removes the chevron
- Dropdown `<ul>` has max-height with overflow scroll

### `[role="textbox"]`

Styled like a Pico form element with proper focus states and transitions.

---

## Utility Classes

| Class | Description |
|---|---|
| `.desktop-only` | Hidden below 768px |
| `.mobile-only` | Hidden at ≥ 768px |
| `.sr-only` | Visually hidden, screen-reader accessible |
| `[hidden]` | `display: none` |

---

## Quick Reference

| You want… | Use this |
|---|---|
| Colored button | `<button variant="success">OK</button>` |
| 3D button | `<button class="raised">Click</button>` |
| Ghost button | `<button class="plain">Ghost</button>` |
| Tag / badge | `<pico-tag variant="info">New</pico-tag>` |
| Pill tag | `<pico-tag pill>Tag</pico-tag>` |
| Outlined tag | `<pico-tag outlined>Tag</pico-tag>` |
| Removable tag | `<pico-tag removable>Tag</pico-tag>` |
| Star rating | `<pico-rating name="r" max="5"></pico-rating>` |
| Multi-select | `<pico-multiselect name="m"><option>…</option></pico-multiselect>` |
| Callout | `<aside variant="info"><div class="callout">…</div></aside>` |
| Toast | `PicoToast.show("msg", { variant: "success" })` |
| Modal open | `PicoModal.open(dialog)` |
| Split panel | `<pico-split-panel><div slot="start">…</div><div slot="end">…</div></pico-split-panel>` |
| Stack layout | `<div class="stack">…</div>` |
| Cluster layout | `<div class="cluster">…</div>` |
| Split layout | `<div class="split">…</div>` |
| Flank layout | `<div class="flank">…</div>` |
| Frame | `<div class="frame">…</div>` |
| Custom color | `style="--color: #e91e63"` |

---

## Pico CSS Conventions (inherited)

All standard Pico CSS patterns remain valid:

- `.container` / `.container-fluid` for layout
- `<article>` for cards
- `<details><summary>…</summary>…</details>` for accordions
- `<details class="dropdown">` for dropdowns
- `<nav>` with `<ul>` for navigation
- `role="group"` for input groups
- `role="switch"` for toggle switches
- `aria-invalid` for form validation
- `aria-busy="true"` for loading states
- `data-tooltip` for tooltips
- `data-theme="light|dark"` for theme control
- All `--pico-*` CSS custom properties for theming