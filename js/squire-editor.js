import Squire from "squire-rte";
import DOMPurify from "dompurify";

/*/ HACK fixes squire inside of shadowroot
const originalFireEvent = Squire.prototype.fireEvent;
Squire.prototype.fireEvent = function (type, detail) {
  if (/^(?:focus|blur)/.test(type)) {
    const isFocused = true; // this._root === document.activeElement;
    const isFocusEvent = type === "focus";

    if (isFocused !== isFocusEvent || this._isFocused === isFocusEvent) {
      return this;
    }

    this._isFocused = isFocusEvent;
  }
  originalFireEvent.call(this, type, detail);
}; // */

class PicoSquireEditor extends HTMLElement {
  static formAssociated = true;

  /** @type {Squire} */
  #squire = null;

  /** @type {ElementInternals} */
  #internals = this.attachInternals();

  /** @type {ShadowRoot} */
  #shadowRoot = this; // .attachShadow({ mode: "open" });

  /** @type {HTMLDivElement} */
  #container = this.#shadowRoot.appendChild(document.createElement("div"));

  connectedCallback() {
    const value = this.getAttribute("value") || "";

    const container = this.#container;

    // ensure accessibility
    container.role = "textbox";
    container.ariaMultiLine = true;

    // add toolbar slot
    const toolbar = document.createElement("slot");
    toolbar.name = "toolbar";
    toolbar.part = "toolbar";
    this.#shadowRoot.prepend(toolbar);

    const editor = container.appendChild(document.createElement("div"));
    editor.part = "editor";
    editor.style.position = "relative"; // fix for image resize handles, see https://github.com/fastmail/Squire/issues/113
    editor.style.minHeight = "var(--min-height, min-content)"; // ensure editor is visible when empty

    const squire = (this.#squire = new Squire(editor, {
      sanitizeToDOMFragment: (html) =>
        DOMPurify.sanitize(html, {
          RETURN_DOM_FRAGMENT: true,
          FORCE_BODY: false,
          WHOLE_DOCUMENT: false,
          ALLOW_UNKNOWN_PROTOCOLS: true,
          RETURN_DOM: true,
        }),
    }));
    squire.setHTML(value);

    squire.addEventListener("input", ($event) => {
      this.updateFormValue();
      this.#emitEvent("input", $event.detail);
    });
    squire.addEventListener("pathChange", ($event) =>
      this.#emitEvent("state", $event.detail),
    );
    squire.addEventListener("select", ($event) =>
      this.#emitEvent("state", $event.detail),
    );
    squire.addEventListener("undoStateChange", ($event) =>
      this.#emitEvent("undoState", $event.detail),
    );
    squire.addEventListener("pasteImage", function ($event) {
      let payload = [...$event.detail.clipboardData.items];
      payload = payload.filter((i) => /image/.test(i.type));
      if (!payload.length || payload.length === 0) return false;

      const reader = new FileReader();
      reader.onload = (e) => squire.insertImage(e.target.result);
      reader.readAsDataURL(payload[0].getAsFile());
    });

    this.updateFormValue();
  }

  #emitEvent(key, detail = {}, options = { bubbles: true }) {
    return this.dispatchEvent(
      new CustomEvent(key, Object.assign({ detail }, options)),
    );
  }

  disconnectedCallback() {
    if (this.#squire) {
      this.#squire.destroy();
    }
  }

  // Form integration
  updateFormValue() {
    const html = this.#squire.getHTML();
    this.#internals.setFormValue(html);
  }

  get form() {
    return this.#internals.form;
  }

  get name() {
    return this.getAttribute("name");
  }

  get value() {
    return this.#squire.getHTML();
  }

  set value(html) {
    this.#squire.setHTML(html);
    this.updateFormValue();
  }

  getSquire() {
    return this.#squire;
  }

  isActive(name, attributes = {}) {
    if (typeof name === "object") {
      attributes = name;
      name = "DIV";
      console.log(this.#squire.getPath());
    }

    return this.#squire.hasFormat(name, attributes);
  }

  changeStyle(styles = {}) {
    this.#squire.forEachBlock((/** @type HTMLElement */ block) => {
      Object.entries(styles).forEach(
        ([/** @type String */ key, value]) => (block.style[key] = value),
      );
    }, true);
  }

  changeBlock(tag) {
    this.#squire.modifyBlocks(function (fragment) {
      const output = document.createDocumentFragment();

      // Iterate through each block element
      let node = fragment.firstChild;
      while (node) {
        const next = node.nextSibling;

        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = document.createElement(tag);
          // Move the contents of the block into the new element
          while (node.firstChild) {
            element.appendChild(node.firstChild);
          }
          // Preserve direction attribute if present
          if (node.dir) element.dir = node.dir;
          output.appendChild(element);
        } else {
          output.appendChild(node);
        }

        node = next;
      }

      return output;
    });
  }

  insert(html) {
    this.#squire.insertHTML(html);
  }

  growSelection() {
    const range = this.#squire.getSelection();
    if (!range) {
      return;
    }

    let node = range.startContainer;
    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentNode;
    }

    if (node && node !== this) {
      range.selectNode(node);
      this.#squire.setSelection(range);
    }
  }

  toggle(tag) {
    switch (tag) {
      case "b":
      case "strong":
      case "i":
      case "em":
      case "u":
      case "strike":
      case "sub":
      case "sup":
      case "code":
        return !this.isActive(tag)
          ? this.#squire.changeFormat({ tag })
          : this.#squire.changeFormat(null, { tag });
      case "a":
        if (this.isActive(tag)) {
          return this.#squire.removeLink();
        } else {
          const url = prompt("Enter the URL for the link:", "https://");
          if (url) {
            return this.#squire.makeLink(url);
          }
        }
        return;
      case "ul":
        return this.isActive(tag)
          ? this.#squire.removeList()
          : this.#squire.makeUnorderedList();
      case "ol":
        return this.isActive(tag)
          ? this.#squire.removeList()
          : this.#squire.makeOrderedList();
      case "blockquote":
      case "pre":
      case "p":
      case "h1":
      case "h2":
      case "h3":
      case "h4":
      case "h5":
      case "h6":
        return this.changeBlock(tag);
    }
  }

  // Table functions
  createTable({ rows = 3, columns = 3 } = {}) {
    const table = document.createElement("table");
    const tbody = table.appendChild(document.createElement("tbody"));

    for (let i = 0; i < rows; i++) {
      const tr = document.createElement("tr");
      for (let j = 0; j < columns; j++) {
        const td = document.createElement("td");
        td.appendChild(document.createElement("br"));
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }

    return this.#squire.insertElement(table);
  }

  addTableRow() {
    const cell = this.#getSelectedTableCell();
    if (!cell) return;

    const row = cell.closest("tr");
    const table = cell.closest("table");
    const columnCount = row.children.length;

    const newRow = document.createElement("tr");
    for (let i = 0; i < columnCount; i++) {
      const td = document.createElement("td");
      td.appendChild(document.createElement("br"));
      newRow.appendChild(td);
    }

    row.parentNode.insertBefore(newRow, row.nextSibling);
    this.#squire.fireEvent("input");
  }

  addTableColumn() {
    const cell = this.#getSelectedTableCell();
    if (!cell) return;

    const cellIndex = Array.from(cell.parentNode.children).indexOf(cell);
    const table = cell.closest("table");
    const rows = table.querySelectorAll("tr");

    rows.forEach((row) => {
      const newCell = document.createElement(
        row.parentNode.tagName === "THEAD" ? "th" : "td",
      );
      newCell.appendChild(document.createElement("br"));
      const targetCell = row.children[cellIndex];
      if (targetCell) {
        targetCell.parentNode.insertBefore(newCell, targetCell.nextSibling);
      }
    });

    this.#squire.fireEvent("input");
  }

  deleteTableRows() {
    const cells = this.#getSelectedTableCells();
    if (!cells.length) return;

    const rows = new Set(cells.map((cell) => cell.closest("tr")));
    rows.forEach((row) => row.remove());
    this.#squire.fireEvent("input");
  }

  deleteTableColumns() {
    const cells = this.#getSelectedTableCells();
    if (!cells.length) return;

    const cell = cells[0];
    const table = cell.closest("table");
    const columnIndices = new Set(
      cells.map((c) => Array.from(c.parentNode.children).indexOf(c)),
    );

    const rows = table.querySelectorAll("tr");
    rows.forEach((row) => {
      columnIndices.forEach((index) => {
        if (row.children[index]) {
          row.children[index].remove();
        }
      });
    });

    this.#squire.fireEvent("input");
  }

  deleteTable() {
    const cell = this.#getSelectedTableCell();
    if (!cell) return;

    const table = cell.closest("table");
    if (table) {
      table.remove();
      this.#squire.fireEvent("input");
    }
  }

  toggleTableHeading() {
    const cells = this.#getSelectedTableCells();
    if (!cells.length) return;

    cells.forEach((cell) => {
      const newTag = cell.tagName === "TH" ? "td" : "th";
      const newCell = document.createElement(newTag);

      while (cell.firstChild) {
        newCell.appendChild(cell.firstChild);
      }

      Array.from(cell.attributes).forEach((attr) => {
        newCell.setAttribute(attr.name, attr.value);
      });

      cell.parentNode.replaceChild(newCell, cell);
    });

    this.#squire.fireEvent("input");
  }

  mergeTableCells() {
    const cells = this.#getSelectedTableCells();
    if (cells.length < 2) return;

    const firstCell = cells[0];
    const content = document.createDocumentFragment();

    cells.forEach((cell, index) => {
      if (index > 0) {
        while (cell.firstChild) {
          content.appendChild(cell.firstChild);
        }
        cell.remove();
      }
    });

    while (content.firstChild) {
      firstCell.appendChild(content.firstChild);
    }

    const colspan = cells.reduce(
      (sum, cell) => sum + (parseInt(cell.getAttribute("colspan")) || 1),
      0,
    );
    if (colspan > 1) {
      firstCell.setAttribute("colspan", colspan);
    }

    this.#squire.fireEvent("input");
  }

  splitTableCell() {
    const cell = this.#getSelectedTableCell();
    if (!cell) return;

    const colspan = parseInt(cell.getAttribute("colspan")) || 1;
    if (colspan <= 1) return;

    cell.removeAttribute("colspan");

    for (let i = 1; i < colspan; i++) {
      const newCell = document.createElement(cell.tagName);
      newCell.appendChild(document.createElement("br"));
      cell.parentNode.insertBefore(newCell, cell.nextSibling);
    }

    this.#squire.fireEvent("input");
  }

  #getSelectedTableCell() {
    const range = this.#squire.getSelection();
    let node = range.startContainer;

    while (node && node !== this) {
      if (node.tagName === "TD" || node.tagName === "TH") {
        return node;
      }
      node = node.parentNode;
    }

    return null;
  }

  #getSelectedTableCells() {
    const selection = window.getSelection();
    if (!selection.rangeCount) return [];

    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const table =
      container.nodeType === Node.ELEMENT_NODE
        ? container.closest("table")
        : container.parentElement?.closest("table");

    if (!table) {
      const cell = this.#getSelectedTableCell();
      return cell ? [cell] : [];
    }

    const cells = Array.from(table.querySelectorAll("td, th"));
    return cells.filter((cell) => selection.containsNode(cell, true));
  }
}

customElements.define("pico-squire-editor", PicoSquireEditor);

export default PicoSquireEditor;
