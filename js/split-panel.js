// see https://webawesome.com/docs/components/split-panel/

export class PicoSplitPanel extends HTMLElement {
  static get observedAttributes() {
    return [
      "position",
      "position-in-pixels",
      "orientation",
      "disabled",
      "primary",
      "snap",
      "snap-threshold",
    ];
  }

  constructor() {
    super();

    this._position = 50;
    this._positionInPixels = 0;
    this._orientation = "horizontal";
    this._disabled = false;
    this._primary = null;
    this._snap = null;
    this._snapThreshold = 12;

    this._cachedPositionInPixels = 0;
    this._isCollapsed = false;
    this._positionBeforeCollapsing = 0;
    this._size = 0;
    this._isDragging = false;

    const shadow = this.attachShadow({ mode: "open" });

    const template = document.createElement("template");
    template.innerHTML = `
      <style>
        :host {
          --divider-width: 4px;
          --divider-hit-area: 12px;
          --min: 0%;
          --max: 100%;

          display: grid;
          position: relative;
          box-sizing: border-box;
        }

        :host([hidden]) {
          display: none;
        }

        :host([orientation="horizontal"]) {
          flex-direction: row;
        }

        :host([orientation="vertical"]) {
          flex-direction: column;
        }

        ::slotted([slot="start"]),
        ::slotted([slot="end"]) {
          overflow: auto;
        }

        .divider {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: var(--pico-muted-border-color);
          cursor: col-resize;
          user-select: none;
          z-index: 1;
        }

        :host([orientation="vertical"]) .divider {
          cursor: row-resize;
        }

        .divider:focus {
          outline: 2px solid var(--pico-primary-focus);
          outline-offset: -2px;
        }

        .divider::after {
          content: "";
          position: absolute;
          inset: calc(var(--divider-hit-area) / -2 + var(--divider-width) / 2);
        }

        :host([disabled]) .divider {
          cursor: default;
        }

        :host([orientation="horizontal"]) .divider::after {
          left: calc(var(--divider-hit-area) / -2 + var(--divider-width) / 2);
          right: calc(var(--divider-hit-area) / -2 + var(--divider-width) / 2);
          top: 0;
          bottom: 0;
        }

        :host([orientation="vertical"]) .divider::after {
          top: calc(var(--divider-hit-area) / -2 + var(--divider-width) / 2);
          bottom: calc(var(--divider-hit-area) / -2 + var(--divider-width) / 2);
          left: 0;
          right: 0;
        }
      </style>
      <slot name="start" part="panel start"></slot>
      <div part="divider" class="divider" tabindex="0" role="separator">
        <slot name="divider"></slot>
      </div>
      <slot name="end" part="panel end"></slot>
    `;

    shadow.appendChild(template.content.cloneNode(true));

    this._divider = shadow.querySelector(".divider");

    this._handleKeyDown = this._handleKeyDown.bind(this);
    this._handlePointerDown = this._handlePointerDown.bind(this);
    this._handlePointerMove = this._handlePointerMove.bind(this);
    this._handlePointerUp = this._handlePointerUp.bind(this);
    this._handleResize = this._handleResize.bind(this);
  }

  connectedCallback() {
    this._divider.addEventListener("keydown", this._handleKeyDown);
    this._divider.addEventListener("mousedown", this._handlePointerDown);
    this._divider.addEventListener("touchstart", this._handlePointerDown);

    this._resizeObserver = new ResizeObserver(this._handleResize);
    this._resizeObserver.observe(this);

    this._detectSize();
    this._cachedPositionInPixels = this._percentageToPixels(this._position);
    this._updatePosition();
  }

  disconnectedCallback() {
    this._divider.removeEventListener("keydown", this._handleKeyDown);
    this._divider.removeEventListener("mousedown", this._handlePointerDown);
    this._divider.removeEventListener("touchstart", this._handlePointerDown);

    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
    }

    this._removeDragListeners();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    switch (name) {
      case "position":
        this._position = parseFloat(newValue) || 50;
        this._onPositionChange();
        break;
      case "position-in-pixels":
        this._positionInPixels = parseFloat(newValue) || 0;
        this._onPositionInPixelsChange();
        break;
      case "orientation":
        this._orientation = newValue === "vertical" ? "vertical" : "horizontal";
        this._detectSize();
        this._updatePosition();
        break;
      case "disabled":
        this._disabled = newValue !== null;
        this._divider.tabIndex = this._disabled ? -1 : 0;
        break;
      case "primary":
        this._primary =
          newValue === "start" || newValue === "end" ? newValue : null;
        this._updatePosition();
        break;
      case "snap":
        this._snap = newValue;
        break;
      case "snap-threshold":
        this._snapThreshold = parseFloat(newValue) || 12;
        break;
    }
  }

  get position() {
    return this._position;
  }

  set position(value) {
    this.setAttribute("position", value);
  }

  get positionInPixels() {
    return this._positionInPixels;
  }

  set positionInPixels(value) {
    this.setAttribute("position-in-pixels", value);
  }

  get orientation() {
    return this._orientation;
  }

  set orientation(value) {
    this.setAttribute("orientation", value);
  }

  get disabled() {
    return this._disabled;
  }

  set disabled(value) {
    if (value) {
      this.setAttribute("disabled", "");
    } else {
      this.removeAttribute("disabled");
    }
  }

  get primary() {
    return this._primary;
  }

  set primary(value) {
    if (value) {
      this.setAttribute("primary", value);
    } else {
      this.removeAttribute("primary");
    }
  }

  get snap() {
    return this._snap;
  }

  set snap(value) {
    if (value) {
      this.setAttribute("snap", value);
    } else {
      this.removeAttribute("snap");
    }
  }

  get snapThreshold() {
    return this._snapThreshold;
  }

  set snapThreshold(value) {
    this.setAttribute("snap-threshold", value);
  }

  _detectSize() {
    const { width, height } = this.getBoundingClientRect();
    this._size = this._orientation === "vertical" ? height : width;
  }

  _percentageToPixels(value) {
    return this._size * (value / 100);
  }

  _pixelsToPercentage(value) {
    return (value / this._size) * 100;
  }

  _clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  _handlePointerDown(event) {
    if (this._disabled) return;

    if (event.cancelable) {
      event.preventDefault();
    }

    this._isDragging = true;
    document.addEventListener("mousemove", this._handlePointerMove);
    document.addEventListener("mouseup", this._handlePointerUp);
    document.addEventListener("touchmove", this._handlePointerMove);
    document.addEventListener("touchend", this._handlePointerUp);

    document.body.style.userSelect = "none";
  }

  _handlePointerMove(event) {
    if (!this._isDragging) return;

    const rect = this.getBoundingClientRect();
    const isRtl = getComputedStyle(this).direction === "rtl";

    let clientX, clientY;
    if (event.type.startsWith("touch")) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }

    let newPositionInPixels =
      this._orientation === "vertical"
        ? clientY - rect.top
        : clientX - rect.left;

    if (this._primary === "end") {
      newPositionInPixels = this._size - newPositionInPixels;
    }

    if (this._snap) {
      const snaps = this._snap.split(" ");

      snaps.forEach((value) => {
        let snapPoint;

        if (value.endsWith("%")) {
          snapPoint = this._size * (parseFloat(value) / 100);
        } else {
          snapPoint = parseFloat(value);
        }

        if (isRtl && this._orientation === "horizontal") {
          snapPoint = this._size - snapPoint;
        }

        if (
          newPositionInPixels >= snapPoint - this._snapThreshold &&
          newPositionInPixels <= snapPoint + this._snapThreshold
        ) {
          newPositionInPixels = snapPoint;
        }
      });
    }

    this._position = this._clamp(
      this._pixelsToPercentage(newPositionInPixels),
      0,
      100,
    );
    this._onPositionChange();
  }

  _handlePointerUp() {
    if (!this._isDragging) return;

    this._isDragging = false;
    this._removeDragListeners();
    document.body.style.userSelect = "";
  }

  _removeDragListeners() {
    document.removeEventListener("mousemove", this._handlePointerMove);
    document.removeEventListener("mouseup", this._handlePointerUp);
    document.removeEventListener("touchmove", this._handlePointerMove);
    document.removeEventListener("touchend", this._handlePointerUp);
  }

  _handleKeyDown(event) {
    if (this._disabled) return;

    if (
      [
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
        "Home",
        "End",
        "Enter",
      ].includes(event.key)
    ) {
      let newPosition = this._position;
      const incr =
        (event.shiftKey ? 10 : 1) * (this._primary === "end" ? -1 : 1);

      event.preventDefault();

      if (
        (event.key === "ArrowLeft" && this._orientation === "horizontal") ||
        (event.key === "ArrowUp" && this._orientation === "vertical")
      ) {
        newPosition -= incr;
      }

      if (
        (event.key === "ArrowRight" && this._orientation === "horizontal") ||
        (event.key === "ArrowDown" && this._orientation === "vertical")
      ) {
        newPosition += incr;
      }

      if (event.key === "Home") {
        newPosition = this._primary === "end" ? 100 : 0;
      }

      if (event.key === "End") {
        newPosition = this._primary === "end" ? 0 : 100;
      }

      if (event.key === "Enter") {
        if (this._isCollapsed) {
          newPosition = this._positionBeforeCollapsing;
          this._isCollapsed = false;
        } else {
          const positionBeforeCollapsing = this._position;
          newPosition = 0;

          requestAnimationFrame(() => {
            this._isCollapsed = true;
            this._positionBeforeCollapsing = positionBeforeCollapsing;
          });
        }
      }

      this._position = this._clamp(newPosition, 0, 100);
      this._onPositionChange();
    }
  }

  _handleResize(entries) {
    const { width, height } = entries[0].contentRect;
    this._size = this._orientation === "vertical" ? height : width;

    if (isNaN(this._cachedPositionInPixels) || this._position === Infinity) {
      const attrValue = parseFloat(this.getAttribute("position-in-pixels"));
      this._cachedPositionInPixels = attrValue || 0;
      this._positionInPixels = attrValue || 0;
      this._position = this._pixelsToPercentage(this._positionInPixels);
    }

    if (this._primary) {
      this._position = this._pixelsToPercentage(this._cachedPositionInPixels);
    }

    this._updatePosition();
  }

  _onPositionChange() {
    this._cachedPositionInPixels = this._percentageToPixels(this._position);
    this._positionInPixels = this._percentageToPixels(this._position);
    this._isCollapsed = false;
    this._positionBeforeCollapsing = 0;
    this._updatePosition();
    this._dispatchRepositionEvent();
  }

  _onPositionInPixelsChange() {
    this._position = this._pixelsToPercentage(this._positionInPixels);
    this._updatePosition();
  }

  _updatePosition() {
    const gridTemplate =
      this._orientation === "vertical"
        ? "gridTemplateRows"
        : "gridTemplateColumns";
    const gridTemplateAlt =
      this._orientation === "vertical"
        ? "gridTemplateColumns"
        : "gridTemplateRows";
    const isRtl = getComputedStyle(this).direction === "rtl";

    const primary = `
      clamp(
        0%,
        clamp(
          var(--min),
          ${this._position}% - var(--divider-width) / 2,
          var(--max)
        ),
        calc(100% - var(--divider-width))
      )
    `;
    const secondary = "auto";

    if (this._primary === "end") {
      if (isRtl && this._orientation === "horizontal") {
        this.style[gridTemplate] =
          `${primary} var(--divider-width) ${secondary}`;
      } else {
        this.style[gridTemplate] =
          `${secondary} var(--divider-width) ${primary}`;
      }
    } else {
      if (isRtl && this._orientation === "horizontal") {
        this.style[gridTemplate] =
          `${secondary} var(--divider-width) ${primary}`;
      } else {
        this.style[gridTemplate] =
          `${primary} var(--divider-width) ${secondary}`;
      }
    }

    this.style[gridTemplateAlt] = "";

    this._divider.setAttribute("aria-valuenow", this._position);
    this._divider.setAttribute("aria-valuemin", "0");
    this._divider.setAttribute("aria-valuemax", "100");
  }

  _dispatchRepositionEvent() {
    this.dispatchEvent(
      new CustomEvent("reposition", {
        bubbles: true,
        composed: true,
        detail: {
          position: this._position,
          positionInPixels: this._positionInPixels,
        },
      }),
    );
  }
}

customElements.define("pico-split-panel", PicoSplitPanel);
