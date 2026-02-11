# Pico X

A minimal component and utility layer on top of [Pico CSS v2](https://picocss.com). Semantic HTML first, class-light, fully themeable.

Adds a variant/color system, layout primitives, enhanced buttons, web components (tags, rating, multi-select, split panel, toast, modal helpers), and utility classes — all designed to feel native to Pico CSS.

## Installation

Install from GitHub:

```bash
npm install github:tommy4st/pico-x
```

Pico CSS is a peer dependency:

```bash
npm install @picocss/pico
```

### Usage with a bundler

```js
import "@picocss/pico/css/pico.css";
import "pico-x/css";
import { Pico, PicoToast, PicoModal } from "pico-x";
```

### Usage via `<link>` and `<script>`

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
| `pico-x` | Core components + split panel (everything except squire editor) |
| `pico-x/css` | CSS extensions only |
| `pico-x/components` | `PicoTag`, `PicoRating`, `PicoMultiselect`, `PicoToast`, `PicoModal` |
| `pico-x/split-panel` | `PicoSplitPanel` web component |
| `pico-x/squire-editor` | `PicoSquireEditor` (optional, requires `squire-rte` + `dompurify`) |

---

## Variant System

Add `variant="name"` to any element to remap all `--pico-primary-*` tokens. Works on buttons, cards, tags, callouts — anything that uses Pico's primary color.

### Semantic variants

```html
<button variant="info">Info</button>
<button variant="success">Success</button>
<button variant="warning">Warning</button>
<button variant="danger">Danger</button>
```

### Named color variants

`red`, `pink`, `fuchsia`, `purple`, `violet`, `indigo`, `blue`, `azure`, `cyan`, `jade`, `green`, `lime`, `yellow`, `amber`, `pumpkin`, `orange`, `zinc`, `slate`, `gray`, `sand`

```html
<button variant="indigo">Indigo</button>
<article variant="success">
  <h3>Success Card</h3>
  <p>All primary tokens are remapped.</p>
</article>
```

### Custom color via inline style

```html
<button style="--color: #e91e63">Custom Pink</button>
<button style="--color: #009688" class="outline">Custom Teal Outline</button>
```

### Size attribute

```html
<span size="small">Small</span>
<span size="large">Large</span>
<span size="x-large">X-Large</span>
```

---

## Layout Primitives

All layout primitives reset child margins and use `--pico-spacing` as the default gap.

### Stack

Vertical flex column.

```html
<div class="stack">
  <p>First</p>
  <p>Second</p>
  <p>Third</p>
</div>
```

### Cluster

Horizontal wrapping flex row, centered vertically.

```html
<div class="cluster">
  <button>One</button>
  <button>Two</button>
  <button>Three</button>
</div>
```

### Split

Space-between flex row. First child shrinks, last child pushes to the end.

```html
<div class="split">
  <strong>Title</strong>
  <button>Action</button>
</div>
```

Modifier: `split:column` for vertical split.

### Flank

Sidebar layout. First child is the sidebar, second is the content.

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

Aspect-ratio container for images/video.

```html
<div class="frame">
  <img src="photo.jpg" alt="Photo">
</div>
```

Modifiers: `frame:square` (1:1), `frame:landscape` (16:9), `frame:portrait` (9:16).

### Grid (enhanced)

Pico's `.grid` is enhanced with `auto-fit` and a configurable `--min-column-size`:

```html
<div class="grid" style="--min-column-size: 15ch">
  <div>Column</div>
  <div>Column</div>
  <div>Column</div>
</div>
```

---

## Buttons

All Pico button styles are preserved. Pico X adds:

### Raised (3D)

```html
<button class="raised">Raised</button>
```

### Plain (ghost)

```html
<button class="plain">Ghost Button</button>
```

### Combined with variants

```html
<button variant="danger" class="raised">Delete</button>
<button variant="success" class="plain">Save</button>
```

---

## Components

### Tag — `<pico-tag>`

Inline label/badge element. Supports variants, pills, outlines, and removal.

```html
<pico-tag>Default</pico-tag>
<pico-tag variant="success">Success</pico-tag>
<pico-tag variant="danger" pill>Pill</pico-tag>
<pico-tag variant="info" outlined>Outlined</pico-tag>
<pico-tag removable>Removable</pico-tag>
```

| Attribute | Description |
|---|---|
| `variant` | Color variant |
| `pill` | Rounded pill shape |
| `outlined` | Transparent background, colored border/text |
| `removable` | Adds a close button, emits `remove` event |

**Events:** `remove` — fired when the close button is clicked. `detail.value` contains the tag text or `data-value`.

### Rating — `<pico-rating>`

Star rating input. Form-associated.

```html
<label>
  Rating
  <pico-rating name="score" value="3" max="5" required></pico-rating>
</label>
```

| Attribute | Description |
|---|---|
| `name` | Form field name |
| `value` | Current value (0–max) |
| `max` | Number of stars (default `5`) |
| `symbol` | Custom star character |
| `readonly` | Disable interaction |
| `required` | Form validation |

**Events:** `input`, `change` — fired on value change.

### Multi-select — `<pico-multiselect>`

Dropdown with checkbox options and tag display. Form-associated.

```html
<label>
  Languages
  <pico-multiselect name="langs" placeholder="Select languages…" required>
    <option value="js" selected>JavaScript</option>
    <option value="ts">TypeScript</option>
    <option value="py">Python</option>
    <option value="rs">Rust</option>
  </pico-multiselect>
</label>
```

| Attribute | Description |
|---|---|
| `name` | Form field name |
| `placeholder` | Placeholder text |
| `required` | Form validation |

**Properties:** `value` (get/set `string[]`).

**Events:** `change` — fired when selection changes.

### Callout

Styled alert/notice box. Pure CSS (no JS needed).

```html
<aside variant="info">
  <div class="callout">
    <strong>Note</strong>
    <div class="callout-content">
      <p>This is an informational callout.</p>
    </div>
    <button type="button" class="close" aria-label="Dismiss"></button>
  </div>
</aside>
```

Works with all variants: `info`, `success`, `warning`, `danger`, or any named/custom color.

### Toast — `PicoToast`

Notification toasts. Appear in the top-right corner with slide-in animation.

```js
import { PicoToast } from "pico-x";

// Basic
PicoToast.show("Saved!");

// With variant and custom duration
PicoToast.show("Something went wrong.", { variant: "danger", duration: 5000 });

// Sticky (no auto-dismiss)
const toast = PicoToast.show("Processing…", { variant: "info", duration: 0 });

// Dismiss programmatically
PicoToast.dismiss(toast);
```

| Option | Default | Description |
|---|---|---|
| `variant` | — | Color variant |
| `duration` | `3000` | Auto-dismiss in ms. `0` = sticky. |

### Modal — `PicoModal`

Open/close helpers for native `<dialog>` elements with Pico CSS transition classes.

```html
<button onclick="PicoModal.open(document.getElementById('my-modal'))">
  Open Modal
</button>

<dialog id="my-modal">
  <article>
    <header>
      <button aria-label="Close" rel="prev"
        onclick="PicoModal.close(this.closest('dialog'))"></button>
      <h3>Modal Title</h3>
    </header>
    <p>Modal content.</p>
    <footer>
      <button class="secondary"
        onclick="PicoModal.close(this.closest('dialog'))">Cancel</button>
      <button onclick="PicoModal.close(this.closest('dialog'))">Confirm</button>
    </footer>
  </article>
</dialog>
```

```js
import { PicoModal } from "pico-x";

await PicoModal.open(dialogElement);
await PicoModal.close(dialogElement);
PicoModal.current; // currently visible dialog or null
```

Add `no-backdrop-close` or `no-escape-close` attributes on the `<dialog>` to prevent those dismiss behaviors.

### Split Panel — `<pico-split-panel>`

Resizable split panel with keyboard support, snap points, and RTL awareness.

```html
<pico-split-panel position="30" orientation="horizontal">
  <div slot="start">Left panel</div>
  <div slot="end">Right panel</div>
</pico-split-panel>
```

| Attribute | Description |
|---|---|
| `position` | Panel position in percentage (0–100) |
| `position-in-pixels` | Panel position in pixels |
| `orientation` | `horizontal` or `vertical` |
| `disabled` | Disable resizing |
| `primary` | Which panel maintains size on resize: `start` or `end` |
| `snap` | Snap points, e.g. `"100px 50% 200px"` |
| `snap-threshold` | Snap sensitivity in pixels (default `12`) |

**CSS Custom Properties:**

| Property | Default | Description |
|---|---|---|
| `--divider-width` | `4px` | Divider thickness |
| `--divider-hit-area` | `12px` | Interactive grab area |
| `--min` | `0%` | Minimum panel size |
| `--max` | `100%` | Maximum panel size |

**Events:** `reposition` — `detail: { position, positionInPixels }`

### Squire Editor — `<pico-squire-editor>` (optional)

Rich text editor based on [Squire](https://github.com/fastmail/Squire). Form-associated.

Requires optional dependencies:

```bash
npm install squire-rte dompurify
```

```js
import "pico-x/squire-editor";
```

```html
<pico-squire-editor name="content" value="<p>Hello</p>">
  <div slot="toolbar"><!-- your toolbar buttons --></div>
</pico-squire-editor>
```

Key methods: `toggle(tag)`, `changeBlock(tag)`, `changeStyle(styles)`, `insert(html)`, `createTable()`, `getSquire()`.

---

## CSS Enhancements

### Typography & Base

- `overflow-wrap: anywhere` on headings and paragraphs
- `hyphens: auto` on paragraphs
- `field-sizing: content` on textareas
- Last paragraph in a container has no bottom margin
- En-dash (`–`) as default `<ul>` list marker
- `<dt>` and first `<legend>` in `<fieldset>` are bold
- Empty `<small>` elements are hidden
- Tooltips wrap on long text

### Form Enhancements

- Form elements inside `.grid` have no bottom margin
- `label[role="button"]` is styled as an inline button
- Checkbox checked state uses a mask-image checkmark
- Loading spinner (`aria-busy="true"`) uses mask-image

### Modal Adjustments

- Sticky header/footer in dialog articles
- Max-height constrained to viewport
- `padding: 0` on dialog element

### Dropdown Adjustments

- `.dropdown.no-chevron` removes the chevron indicator
- Dropdown `<ul>` has max-height with overflow scroll

### `[role="textbox"]`

Styled like a Pico form element with focus states and transitions.

---

## Utility Classes

| Class | Description |
|---|---|
| `.desktop-only` | Hidden below 768px |
| `.mobile-only` | Hidden at 768px and above |
| `.sr-only` | Visually hidden, accessible to screen readers |
| `[hidden]` | `display: none` |

---

## Dark Mode

Pico X fully supports Pico's dark mode. All variant colors, callouts, and components adapt automatically.

```html
<!-- Auto (OS preference) -->
<meta name="color-scheme" content="light dark">

<!-- Force theme -->
<html data-theme="light">
<html data-theme="dark">
```

---

## Browser Support

Pico X uses modern CSS features (`color-mix()`, `oklch()`, relative color syntax, `field-sizing`, CSS nesting). Requires a modern evergreen browser.

---

## Development

```bash
bun install
# Open index.html in a browser to see the component showcase
```

## License

[MIT](LICENSE)