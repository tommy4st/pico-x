/* ==========================================================================
   Pico — Component Library for Pico CSS
   A single ES module exporting all web components and utilities.

   Components:
     <pico-tag>           — Tag / badge labels
     <pico-rating>        — Star rating input
     <pico-multiselect>   — Multi-select dropdown with tags

   Utilities:
     Pico.toast(message, options)  — Toast notifications
     Pico.modal.open(dialog)       — Modal open/close helpers
   ========================================================================== */

/* ==========================================================================
   Tag — <pico-tag>
   ========================================================================== */

export class PicoTag extends HTMLElement {
  connectedCallback() {
    if (this._init) return;
    this._init = true;

    const text = this.textContent.trim();
    this.textContent = "";

    const label = document.createElement("span");
    label.textContent = text;
    this.appendChild(label);

    if (this.hasAttribute("removable")) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "close";
      btn.setAttribute("aria-label", `Remove ${text}`);
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.remove();
      });
      this.appendChild(btn);
    }
  }

  remove() {
    this.dispatchEvent(
      new CustomEvent("remove", {
        bubbles: true,
        detail: { value: this.dataset.value || this.textContent.trim() },
      }),
    );
    super.remove();
  }
}

customElements.define("pico-tag", PicoTag);

/* ==========================================================================
   Rating — <pico-rating>
   ========================================================================== */

export class PicoRating extends HTMLElement {
  static formAssociated = true;

  constructor() {
    super();
    this._internals = this.attachInternals();
  }

  connectedCallback() {
    if (this._init) return;
    this._init = true;

    this._max = parseInt(this.getAttribute("max") || "5", 10);
    this._value = parseInt(this.getAttribute("value") || "0", 10);
    this._defaultValue = this._value;

    this._internals.setFormValue(this._value ? String(this._value) : null);
    this._updateValidity();

    // Stars
    this._stars = [];
    for (let i = 1; i <= this._max; i++) {
      const btn = document.createElement("span");
      btn.className = "star";
      btn.setAttribute("aria-label", `${i} star${i > 1 ? "s" : ""}`);
      btn.setAttribute("tabindex", "-1");
      btn.textContent = this.hasAttribute("symbol")
        ? this.getAttribute("symbol")
        : "\u2605";
      btn.addEventListener("click", () => {
        if (!this.hasAttribute("readonly")) this.setValue(i);
      });
      btn.addEventListener("mouseenter", () => {
        if (!this.hasAttribute("readonly")) this._highlight(i);
      });
      this._stars.push(btn);
      this.appendChild(btn);
    }

    this.addEventListener("mouseleave", () => this._highlight(this._value));

    // Keyboard support
    if (!this.hasAttribute("readonly")) {
      this.setAttribute("tabindex", "0");
      this.setAttribute("role", "slider");
      this.setAttribute("aria-valuemin", "0");
      this.setAttribute("aria-valuemax", String(this._max));
      this._updateAria();

      this.addEventListener("keydown", (e) => {
        if (this.hasAttribute("readonly")) return;
        let handled = true;
        switch (e.key) {
          case "ArrowRight":
          case "ArrowUp":
            this.setValue(Math.min(this._value + 1, this._max));
            break;
          case "ArrowLeft":
          case "ArrowDown":
            this.setValue(Math.max(this._value - 1, 0));
            break;
          case "Home":
            this.setValue(0);
            break;
          case "End":
            this.setValue(this._max);
            break;
          default:
            handled = false;
        }
        if (handled) e.preventDefault();
      });
    }

    this._highlight(this._value);
  }

  setValue(val) {
    if (val === this._value) val = val - 1;
    this._value = Math.max(0, Math.min(val, this._max));
    this._internals.setFormValue(this._value ? String(this._value) : null);
    this._updateValidity();
    this.setAttribute("value", this._value);
    this._highlight(this._value);
    this._updateAria();
    this.dispatchEvent(new Event("input", { bubbles: true }));
    this.dispatchEvent(new Event("change", { bubbles: true }));
  }

  _highlight(n) {
    this._stars.forEach((star, i) => {
      star.classList.toggle("active", i < n);
    });
  }

  _updateAria() {
    this.setAttribute("aria-valuenow", String(this._value));
    this.setAttribute("aria-valuetext", `${this._value} of ${this._max} stars`);
  }

  get value() {
    return this._value;
  }

  set value(v) {
    this.setValue(parseInt(v, 10));
  }

  get name() {
    return this.getAttribute("name") || "";
  }

  set name(v) {
    this.setAttribute("name", v);
  }

  _updateValidity() {
    if (this.hasAttribute("required") && !this._value) {
      this._internals.setValidity(
        { valueMissing: true },
        "Please select a rating.",
        this._stars?.[0],
      );
    } else {
      this._internals.setValidity({});
    }
  }

  get form() {
    return this._internals.form;
  }

  get validity() {
    return this._internals.validity;
  }

  get validationMessage() {
    return this._internals.validationMessage;
  }

  get willValidate() {
    return this._internals.willValidate;
  }

  checkValidity() {
    return this._internals.checkValidity();
  }

  reportValidity() {
    return this._internals.reportValidity();
  }

  formResetCallback() {
    this._value = this._defaultValue;
    this._internals.setFormValue(this._value ? String(this._value) : null);
    this._updateValidity();
    this.setAttribute("value", this._value);
    this._highlight(this._value);
    this._updateAria();
  }

  formDisabledCallback(disabled) {
    if (disabled) {
      this.setAttribute("aria-disabled", "true");
    } else {
      this.removeAttribute("aria-disabled");
    }
  }
}

customElements.define("pico-rating", PicoRating);

/* ==========================================================================
   Multi-select — <pico-multiselect>
   ========================================================================== */

export class PicoMultiselect extends HTMLElement {
  static formAssociated = true;

  constructor() {
    super();
    this._internals = this.attachInternals();
  }

  connectedCallback() {
    if (this._init) return;
    this._init = true;
    this._renderQueued = false;

    // Parse <option> children before clearing DOM
    this._options = [...this.querySelectorAll("option")].map((opt) => ({
      value: opt.value,
      label: opt.textContent.trim(),
      selected: opt.hasAttribute("selected"),
    }));

    this._selected = new Set(
      this._options.filter((o) => o.selected).map((o) => o.value),
    );

    this._defaultSelected = new Set(this._selected);
    this._name = this.getAttribute("name") || "";
    this._placeholder = this.getAttribute("placeholder") || "Select\u2026";

    this.innerHTML = "";
    this._renderSync();
    this._syncFormValue();

    // Close on outside click
    this._onOutsideClick = (e) => {
      if (!this.contains(e.target) && this.hasAttribute("open")) {
        this._close();
      }
    };
    document.addEventListener("click", this._onOutsideClick);

    // Close on Escape
    this._onKeydown = (e) => {
      if (e.key === "Escape" && this.hasAttribute("open")) {
        e.stopPropagation();
        this._close();
        this._field?.focus();
      }
    };
    document.addEventListener("keydown", this._onKeydown);
  }

  disconnectedCallback() {
    if (this._onOutsideClick) {
      document.removeEventListener("click", this._onOutsideClick);
    }
    if (this._onKeydown) {
      document.removeEventListener("keydown", this._onKeydown);
    }
  }

  _render() {
    if (this._renderQueued) return;
    this._renderQueued = true;
    setTimeout(() => {
      this._renderQueued = false;
      this._renderSync();
    }, 0);
  }

  _syncFormValue() {
    if (this._selected.size === 0) {
      this._internals.setFormValue(null);
    } else {
      const fd = new FormData();
      for (const val of this._selected) {
        fd.append(this._name, val);
      }
      this._internals.setFormValue(fd);
    }
    this._updateValidity();
  }

  _updateValidity() {
    if (this.hasAttribute("required") && this._selected.size === 0) {
      this._internals.setValidity(
        { valueMissing: true },
        "Please select at least one option.",
        this._field,
      );
    } else {
      this._internals.setValidity({});
    }
  }

  _renderSync() {
    const wasOpen = this.hasAttribute("open");
    this.innerHTML = "";

    // Clickable field area
    this._field = document.createElement("div");
    this._field.className = "multiselect-field";
    this._field.setAttribute("tabindex", "0");
    this._field.setAttribute("role", "combobox");
    this._field.setAttribute("aria-expanded", String(wasOpen));
    this._field.setAttribute("aria-haspopup", "listbox");

    this._field.addEventListener(
      "click",
      (e) => {
        if (e.target.closest(".close")) return;
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        this._toggle();
      },
      true,
    );

    this._field.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        this._toggle();
      }
    });

    // Tags for selected items
    if (this._selected.size > 0) {
      for (const val of this._selected) {
        const opt = this._options.find((o) => o.value === val);
        if (!opt) continue;
        const tag = document.createElement("pico-tag");
        tag.setAttribute("removable", "");
        tag.setAttribute("data-value", val);
        tag.textContent = opt.label;
        tag.addEventListener("remove", (e) => {
          e.stopImmediatePropagation();
          this._selected.delete(val);
          this._syncFormValue();
          this._render();
          this.dispatchEvent(new Event("change", { bubbles: true }));
        });
        this._field.appendChild(tag);
      }
    } else {
      const ph = document.createElement("span");
      ph.className = "placeholder";
      ph.textContent = this._placeholder;
      this._field.appendChild(ph);
    }

    // Caret
    const caret = document.createElement("span");
    caret.className = "caret";
    this._field.appendChild(caret);

    this.appendChild(this._field);

    // Dropdown list
    const dropdown = document.createElement("div");
    dropdown.className = "multiselect-dropdown";
    dropdown.setAttribute("role", "listbox");
    dropdown.setAttribute("aria-multiselectable", "true");

    for (const opt of this._options) {
      const label = document.createElement("label");
      label.setAttribute("role", "option");
      label.setAttribute(
        "aria-selected",
        String(this._selected.has(opt.value)),
      );

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = this._selected.has(opt.value);
      checkbox.addEventListener("change", () => {
        if (checkbox.checked) {
          this._selected.add(opt.value);
        } else {
          this._selected.delete(opt.value);
        }
        this._syncFormValue();
        this._render();
        this.dispatchEvent(new Event("change", { bubbles: true }));
      });

      const text = document.createTextNode(opt.label);
      label.append(checkbox, text);
      dropdown.appendChild(label);
    }

    this.appendChild(dropdown);

    if (wasOpen) this.setAttribute("open", "");
  }

  _toggle() {
    this.hasAttribute("open") ? this._close() : this._open();
  }

  _open() {
    this.setAttribute("open", "");
    this._field?.setAttribute("aria-expanded", "true");
  }

  _close() {
    this.removeAttribute("open");
    this._field?.setAttribute("aria-expanded", "false");
  }

  get value() {
    return [...this._selected];
  }

  set value(vals) {
    this._selected = new Set(vals);
    this._syncFormValue();
    this._render();
  }

  get name() {
    return this._name;
  }

  set name(v) {
    this._name = v;
    this._syncFormValue();
  }

  get form() {
    return this._internals.form;
  }

  get validity() {
    return this._internals.validity;
  }

  get validationMessage() {
    return this._internals.validationMessage;
  }

  get willValidate() {
    return this._internals.willValidate;
  }

  checkValidity() {
    return this._internals.checkValidity();
  }

  reportValidity() {
    return this._internals.reportValidity();
  }

  formResetCallback() {
    this._selected = new Set(this._defaultSelected);
    this._syncFormValue();
    this._render();
  }

  formDisabledCallback(disabled) {
    if (disabled) {
      this.setAttribute("aria-disabled", "true");
      this._field?.removeAttribute("tabindex");
    } else {
      this.removeAttribute("aria-disabled");
      this._field?.setAttribute("tabindex", "0");
    }
  }
}

customElements.define("pico-multiselect", PicoMultiselect);

/* ==========================================================================
   Toast — PicoToast.show(message, options)
   ========================================================================== */

let _toastContainer = null;

function _getToastContainer() {
  if (!_toastContainer || !_toastContainer.isConnected) {
    _toastContainer = document.createElement("div");
    _toastContainer.id = "toast-container";
    document.body.appendChild(_toastContainer);
  }
  return _toastContainer;
}

function _createToast(message, variant) {
  const toast = document.createElement("aside");
  toast.className = "callout toast";
  if (variant) toast.setAttribute("variant", variant);
  toast.setAttribute("role", "alert");

  const content = document.createElement("div");
  content.className = "callout-content";
  content.textContent = message;

  const close = document.createElement("button");
  close.type = "button";
  close.className = "close";
  close.setAttribute("aria-label", "Dismiss");
  close.addEventListener("click", () => _dismissToast(toast));

  toast.append(content, close);
  return toast;
}

function _dismissToast(toast) {
  if (toast._dismissing) return;
  toast._dismissing = true;

  toast.dispatchEvent(new CustomEvent("dismiss", { bubbles: true }));
  toast.classList.add("removing");

  const remove = () => {
    toast.remove();
    if (_toastContainer && !_toastContainer.hasChildNodes()) {
      _toastContainer.remove();
      _toastContainer = null;
    }
  };

  toast.addEventListener("animationend", remove, { once: true });
  setTimeout(remove, 400);
}

export const PicoToast = {
  /**
   * Show a toast notification.
   * @param {string} message
   * @param {{ variant?: string, duration?: number }} [options]
   * @returns {HTMLElement}
   */
  show(message, { variant, duration = 3000 } = {}) {
    const toast = _createToast(message, variant);
    _getToastContainer().appendChild(toast);

    if (duration > 0) {
      setTimeout(() => _dismissToast(toast), duration);
    }

    return toast;
  },

  dismiss: _dismissToast,
};

/* ==========================================================================
   Modal — open/close helpers for <dialog>
   ========================================================================== */

const _modalClasses = {
  isOpen: "modal-is-open",
  opening: "modal-is-opening",
  closing: "modal-is-closing",
};
const _scrollbarWidthVar = "--pico-scrollbar-width";
let _visibleModal = null;

function _getScrollbarWidth() {
  return window.innerWidth - document.documentElement.clientWidth;
}

function _waitForAnimation(el, name = null) {
  return new Promise((resolve) => {
    const done = (e) => {
      if (name === null || e.animationName === name) {
        el.removeEventListener("animationend", done);
        resolve();
      }
    };
    el.addEventListener("animationend", done);
  });
}

export const PicoModal = {
  /**
   * Open a <dialog> element with Pico CSS transition classes.
   * @param {HTMLDialogElement} modal
   */
  async open(modal) {
    const { documentElement: html } = document;
    const scrollbarWidth = _getScrollbarWidth();
    if (scrollbarWidth) {
      html.style.setProperty(_scrollbarWidthVar, `${scrollbarWidth}px`);
    }
    html.classList.add(_modalClasses.isOpen, _modalClasses.opening);
    modal.showModal();
    await _waitForAnimation(modal, "modal-overlay");
    _visibleModal = modal;
    html.classList.remove(_modalClasses.opening);
  },

  /**
   * Close a <dialog> element with Pico CSS transition classes.
   * @param {HTMLDialogElement} modal
   */
  async close(modal) {
    _visibleModal = null;
    const { documentElement: html } = document;
    html.classList.add(_modalClasses.closing);
    await _waitForAnimation(modal, "modal-overlay");
    html.classList.remove(_modalClasses.closing, _modalClasses.isOpen);
    html.style.removeProperty(_scrollbarWidthVar);
    modal.close();
  },

  /**
   * Toggle a modal open/closed. Intended for use with [data-target] buttons.
   * @param {Event} event
   */
  toggle(event) {
    event.preventDefault();
    const modal = document.getElementById(event.currentTarget.dataset.target);
    if (!modal) return;
    modal.open ? PicoModal.close(modal) : PicoModal.open(modal);
  },

  /** @returns {HTMLDialogElement|null} The currently visible modal, if any. */
  get current() {
    return _visibleModal;
  },
};

// Close on backdrop click
document.addEventListener("click", (event) => {
  if (!_visibleModal) return;
  const content = _visibleModal.querySelector("article");
  if (
    content &&
    !_visibleModal.hasAttribute("no-backdrop-close") &&
    !content.contains(event.target)
  ) {
    PicoModal.close(_visibleModal);
  }
});

// Close on Escape
document.addEventListener("keydown", (event) => {
  if (
    event.key === "Escape" &&
    _visibleModal &&
    !_visibleModal.hasAttribute("no-escape-close")
  ) {
    PicoModal.close(_visibleModal);
  }
});

/* ==========================================================================
   Convenience namespace
   ========================================================================== */

export const Pico = {
  Tag: PicoTag,
  Rating: PicoRating,
  Multiselect: PicoMultiselect,
  toast: PicoToast,
  modal: PicoModal,
};

export default Pico;
