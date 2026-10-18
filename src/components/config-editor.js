import { injectStyles } from "./styles.js";
import { getConfig, setConfig } from "../config-store.js";
import { removeAfterDeparture } from "./sheet.js";

/*
 * The editor is a modal card of glass over a scrim, the way Horah floats a
 * sheet: it arrives like glass and leaves the way it came. The code is content,
 * so it sits in an opaque cell on the glass, in the system's mono face.
 */
const css = `
.cfg-overlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
}

.cfg-overlay[data-away] {
    pointer-events: none;
}

.cfg-scrim {
    position: absolute;
    inset: 0;
    background: var(--scrim);
    animation: omFadeIn var(--dur-base) var(--ease-gentle) backwards;
}

.cfg-overlay[data-away] .cfg-scrim {
    animation: omFadeOut var(--dur-base) var(--ease-gentle) forwards;
}

.cfg-modal {
    position: relative;
    width: min(860px, 92vw);
    height: min(620px, 84vh);
    display: flex;
    flex-direction: column;
    padding: 8px;
    border-radius: calc(var(--radius-sheet) + 8px);
    overflow: hidden;
    animation: omGlassIn var(--dur-base) var(--ease-spring) backwards;
}

.cfg-overlay[data-away] .cfg-modal {
    animation: omGlassOut var(--dur-base) var(--ease-spring-back) forwards;
}

.cfg-header,
.cfg-footer {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 52px;
    padding: 0 8px 0 12px;
}

.cfg-title {
    flex: 1;
    font-size: var(--text-headline);
    font-weight: 650;
    letter-spacing: -0.02em;
    color: var(--color-text);
}

/* The bar's words: capsules in the pane's own wash; the one that keeps is the lit one. */
.cfg-btn {
    height: 34px;
    padding: 0 16px;
    border: 0;
    border-radius: var(--radius-pill);
    background: var(--fill);
    color: var(--color-text);
    font-size: var(--text-subhead);
    font-weight: 590;
    cursor: pointer;
}

.cfg-btn.primary {
    background: var(--color-accent);
    color: var(--on-accent);
}

@media (hover: hover) {
    .cfg-btn:hover {
        background: var(--fill-strong);
    }

    .cfg-btn.primary:hover {
        background: color-mix(in srgb, var(--color-accent) 88%, var(--color-text));
    }
}

/* ── Editor area: opaque content on the glass ───────────── */
.cfg-editor-wrap {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: row;
    overflow: hidden;
    border-radius: var(--radius-sheet);
    background: var(--color-surface);
}

.cfg-gutter {
    width: 52px;
    flex-shrink: 0;
    overflow: hidden;
    padding: 14px 0;
    user-select: none;
    box-shadow: inset -0.5px 0 0 var(--hairline);
}

.ln {
    display: block;
    font-family: var(--font-mono);
    font-size: var(--text-footnote);
    line-height: 1.7;
    color: var(--label-3);
    text-align: right;
    padding-right: 12px;
    white-space: pre;
    font-variant-numeric: tabular-nums;
}

.ln.ln-err { color: var(--red); }

.cfg-code-wrap {
    flex: 1;
    position: relative;
    overflow: hidden;
}

/* Error line highlight — absolutely positioned, never affects layout */
.cfg-err-highlight {
    position: absolute;
    left: 0;
    right: 0;
    display: none;
    background: color-mix(in srgb, var(--red) 14%, transparent);
    box-shadow: inset 2px 0 0 var(--red);
    pointer-events: none;
    z-index: 0;
}

.cfg-hl,
.cfg-textarea {
    position: absolute;
    inset: 0;
    margin: 0;
    padding: 14px 16px;
    font-family: var(--font-mono);
    font-size: var(--text-footnote);
    line-height: 1.7;
    letter-spacing: 0;
    tab-size: 4;
    white-space: pre;
    word-wrap: normal;
    overflow: auto;
}

.cfg-hl {
    background: transparent;
    color: var(--color-text);
    pointer-events: none;
    z-index: 1;
    border: none;
}

.cfg-textarea {
    background: transparent;
    color: transparent;
    caret-color: var(--color-accent);
    border: none;
    outline: none;
    resize: none;
    z-index: 2;
    -webkit-text-fill-color: transparent;
}

.cfg-textarea::selection {
    background: color-mix(in srgb, var(--color-accent) 30%, transparent);
}

/* Syntax colours from the calendar hues: keys, strings, numbers, literals. */
.hl-key  { color: var(--cal-blue); }
.hl-str  { color: var(--cal-red); }
.hl-num  { color: var(--cal-yellow); }
.hl-bool { color: var(--cal-pink); }
.hl-null { color: var(--cal-pink); }

.cfg-hint {
    flex: 1;
    font-size: var(--text-footnote);
    color: var(--label-3);
    white-space: nowrap;
}
`;

function escHtml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const TOKEN_RE = /("(?:\\u[0-9a-fA-F]{4}|\\[^u]|[^\\"])*"(?:\s*:)?|true|false|null|-?\d+(?:\.\d+)?(?:[eE][+\-]?\d+)?)/g;

function tokenizeLine(line) {
    return escHtml(line).replace(TOKEN_RE, (m) => {
        if (m.startsWith('"')) {
            return m.endsWith(":") || m.endsWith('":')
                ? `<span class="hl-key">${m}</span>`
                : `<span class="hl-str">${m}</span>`;
        }
        if (m === "true" || m === "false") return `<span class="hl-bool">${m}</span>`;
        if (m === "null")                  return `<span class="hl-null">${m}</span>`;
        return `<span class="hl-num">${m}</span>`;
    });
}

function buildHighlight(text) {
    return text.split("\n").map(tokenizeLine).join("\n");
}

function buildGutter(count, errLine) {
    return Array.from({ length: count }, (_, i) =>
        `<span class="ln${i === errLine ? " ln-err" : ""}">${i + 1}</span>`
    ).join("");
}

function autofix(text) {
    return text
        .replace(/,(\s*[}\]])/g, "$1")
        .replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)(\s*:)/g, '$1"$2"$3');
}

function parseErrLine(msg, text) {
    const lm = msg.match(/line (\d+)/i);
    if (lm) return parseInt(lm[1]) - 1;
    const pm = msg.match(/position (\d+)/i);
    if (pm) return text.slice(0, parseInt(pm[1])).split("\n").length - 1;
    return -1;
}

let overlayEl = null;
let pendingApply = null;

// Leaves the way it came; mounted until the departure ends, because a removed element cannot animate.
function closeEditor() {
    const el = overlayEl;
    if (!el) return;
    overlayEl = null;
    pendingApply = null;
    el.dataset.away = "";
    removeAfterDeparture(el, el.querySelector(".cfg-modal"));
}

export function openConfigEditor() {
    if (overlayEl) { closeEditor(); return; }

    injectStyles("config-editor", css);

    overlayEl = document.createElement("div");
    overlayEl.className = "cfg-overlay";
    overlayEl.innerHTML = `
        <div class="cfg-scrim"></div>
        <div class="cfg-modal om-glass" role="dialog" aria-label="Configuration">
            <div class="cfg-header">
                <span class="cfg-title">Configuration</span>
                <button class="cfg-btn om-chip" id="cfg-import">Import</button>
                <button class="cfg-btn om-chip" id="cfg-export">Export</button>
                <button class="cfg-btn om-chip" id="cfg-format">Format</button>
                <input type="file" id="cfg-file" accept="application/json,.json" hidden />
            </div>
            <div class="cfg-editor-wrap">
                <div class="cfg-gutter" aria-hidden="true"></div>
                <div class="cfg-code-wrap">
                    <div class="cfg-err-highlight"></div>
                    <pre class="cfg-hl" aria-hidden="true"></pre>
                    <textarea class="cfg-textarea" spellcheck="false" autocorrect="off" autocapitalize="off"></textarea>
                </div>
            </div>
            <div class="cfg-footer">
                <span class="cfg-hint">⌘↩ Apply · Esc Close</span>
                <button class="cfg-btn om-chip" id="cfg-close">Close</button>
                <button class="cfg-btn primary om-chip" id="cfg-apply">Apply</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlayEl);

    const textarea     = overlayEl.querySelector(".cfg-textarea");
    const pre          = overlayEl.querySelector(".cfg-hl");
    const gutter       = overlayEl.querySelector(".cfg-gutter");
    const errHighlight = overlayEl.querySelector(".cfg-err-highlight");

    let errLine = -1;

    function positionErrHighlight() {
        if (errLine < 0) { errHighlight.style.display = "none"; return; }
        const cs         = getComputedStyle(textarea);
        const lineHeight = parseFloat(cs.lineHeight);
        const paddingTop = parseFloat(cs.paddingTop);
        errHighlight.style.display = "block";
        errHighlight.style.top     = (paddingTop + errLine * lineHeight - textarea.scrollTop) + "px";
        errHighlight.style.height  = lineHeight + "px";
    }

    function syncScroll() {
        gutter.scrollTop = textarea.scrollTop;
        pre.scrollTop    = textarea.scrollTop;
        pre.scrollLeft   = textarea.scrollLeft;
        positionErrHighlight();
    }

    function sync() {
        const text = textarea.value;
        pre.innerHTML    = buildHighlight(text) + "\n";
        gutter.innerHTML = buildGutter(text.split("\n").length, errLine);
        syncScroll();
    }

    function apply() {
        const text = textarea.value;
        try {
            setConfig(JSON.parse(text));
            closeEditor();
            window.location.reload();
        } catch (e) {
            errLine = parseErrLine(e.message, text);
            sync();
        }
    }

    function format() {
        const text = textarea.value.trim();
        const tryFormat = (s) => JSON.stringify(JSON.parse(s), null, 4);
        try {
            textarea.value = tryFormat(text);
            errLine = -1;
        } catch {
            try {
                textarea.value = tryFormat(autofix(text));
                errLine = -1;
            } catch (e) {
                errLine = parseErrLine(e.message, text);
            }
        }
        sync();
        textarea.focus();
    }

    const fileInput = overlayEl.querySelector("#cfg-file");

    function exportConfig() {
        // Export exactly what's in the editor, falling back to saved config if it
        // isn't valid JSON right now.
        let text = textarea.value;
        try {
            text = JSON.stringify(JSON.parse(text), null, 4);
        } catch {
            text = JSON.stringify(getConfig(), null, 4);
        }
        const blob = new Blob([text], { type: "application/json" });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement("a");
        const stamp = new Date().toISOString().slice(0, 10);
        a.href = url;
        a.download = `dashboard-config-${stamp}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    function importConfig(file) {
        const reader = new FileReader();
        reader.onload = () => {
            const raw = String(reader.result);
            try {
                // Load into the editor (formatted) rather than applying blindly,
                // so the user can review before saving.
                textarea.value = JSON.stringify(JSON.parse(raw), null, 4);
                errLine = -1;
            } catch {
                textarea.value = raw;
                errLine = -1;
            }
            sync();
            textarea.focus();
        };
        reader.readAsText(file);
    }

    pendingApply = apply;

    textarea.value = JSON.stringify(getConfig(), null, 4);
    sync();

    textarea.addEventListener("input",  () => { errLine = -1; sync(); });
    textarea.addEventListener("scroll", syncScroll);
    textarea.addEventListener("keydown", (e) => {
        if (e.key === "Tab") {
            e.preventDefault();
            const { selectionStart: s, selectionEnd: end } = textarea;
            textarea.setRangeText("    ", s, end, "end");
            sync();
        }
    });

    overlayEl.querySelector("#cfg-format").addEventListener("click", format);
    overlayEl.querySelector("#cfg-export").addEventListener("click", exportConfig);
    overlayEl.querySelector("#cfg-import").addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", () => {
        const file = fileInput.files?.[0];
        if (file) importConfig(file);
        fileInput.value = "";
    });

    overlayEl.querySelector("#cfg-apply").addEventListener("click", apply);
    overlayEl.querySelector("#cfg-close").addEventListener("click", closeEditor);
    overlayEl.querySelector(".cfg-scrim").addEventListener("mousedown", closeEditor);

    requestAnimationFrame(() => textarea.focus());
}

export function handleEditorKeys(e) {
    if (!overlayEl) return false;
    if (e.key === "Escape")             { closeEditor();               return true; }
    if (e.key === "Enter" && e.metaKey) { e.preventDefault(); pendingApply?.(); return true; }
    return false;
}
