import { injectStyles } from "./styles.js";
import { getConfig, setConfig } from "../config-store.js";

const css = `
.cfg-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.65);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(3px);
}

.cfg-modal {
    background: var(--panel-bg);
    border: 1px solid var(--border);
    border-radius: 6px;
    width: min(820px, 92vw);
    height: min(580px, 82vh);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
}

.cfg-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 9px 14px;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
}

.cfg-title {
    font-size: 0.63rem;
    color: var(--accent);
    letter-spacing: 0.05em;
}

.cfg-header-actions {
    display: flex;
    gap: 4px;
}

.cfg-btn-ghost {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.58rem;
    letter-spacing: 0.05em;
    padding: 2px 8px;
    border: 1px solid transparent;
    border-radius: 3px;
    background: transparent;
    color: var(--dim);
    cursor: pointer;
    transition: all 0.15s;
}
.cfg-btn-ghost:hover {
    border-color: var(--border);
    color: var(--text);
}

/* ── Editor area ─────────────────────────────────────────── */
.cfg-editor-wrap {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: row;
    overflow: hidden;
    background: #111;
}

.cfg-gutter {
    width: 44px;
    flex-shrink: 0;
    background: #0d0d0d;
    border-right: 1px solid var(--border);
    overflow: hidden;
    padding: 12px 0;
    user-select: none;
}

.ln {
    display: block;
    font-family: "JetBrains Mono", monospace;
    font-size: 0.72rem;
    line-height: 1.6;
    color: var(--dim);
    text-align: right;
    padding-right: 10px;
    white-space: pre;
}

.ln.ln-err { color: var(--accent2); }

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
    background: rgba(244, 63, 94, 0.1);
    border-left: 2px solid rgba(244, 63, 94, 0.55);
    pointer-events: none;
    z-index: 0;
}

.cfg-hl,
.cfg-textarea {
    position: absolute;
    inset: 0;
    margin: 0;
    padding: 12px 16px;
    font-family: "JetBrains Mono", monospace;
    font-size: 0.72rem;
    line-height: 1.6;
    tab-size: 4;
    white-space: pre;
    word-wrap: normal;
    overflow: auto;
}

.cfg-hl {
    background: #111;
    color: var(--text);
    pointer-events: none;
    z-index: 1;
    border: none;
    scrollbar-width: none;
}
.cfg-hl::-webkit-scrollbar { display: none; }

.cfg-textarea {
    background: transparent;
    color: transparent;
    caret-color: var(--accent);
    border: none;
    outline: none;
    resize: none;
    z-index: 2;
    -webkit-text-fill-color: transparent;
}

/* syntax colors */
.hl-key  { color: #7dd3fc; }
.hl-str  { color: var(--accent3); }
.hl-num  { color: var(--accent); }
.hl-bool { color: #fb923c; }
.hl-null { color: var(--dim); }

/* ── Footer ─────────────────────────────────────────────── */
.cfg-footer {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 7px 14px;
    border-top: 1px solid var(--border);
    flex-shrink: 0;
}

.cfg-hint {
    flex: 1;
    font-size: 0.56rem;
    color: var(--dim);
    white-space: nowrap;
}

.cfg-actions {
    display: flex;
    gap: 6px;
}

.cfg-btn {
    padding: 3px 11px;
    font-family: "JetBrains Mono", monospace;
    font-size: 0.6rem;
    border-radius: 3px;
    border: 1px solid var(--border);
    background: transparent;
    color: var(--text);
    cursor: pointer;
    transition: all 0.15s;
    letter-spacing: 0.03em;
}
.cfg-btn:hover         { border-color: var(--text); }
.cfg-btn.primary       { border-color: var(--accent); color: var(--accent); }
.cfg-btn.primary:hover { background: var(--accent); color: var(--bg); }
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

function closeEditor() {
    overlayEl?.remove();
    overlayEl = null;
    pendingApply = null;
}

export function openConfigEditor() {
    if (overlayEl) { closeEditor(); return; }

    injectStyles("config-editor", css);

    overlayEl = document.createElement("div");
    overlayEl.className = "cfg-overlay";
    overlayEl.innerHTML = `
        <div class="cfg-modal">
            <div class="cfg-header">
                <span class="cfg-title">// CONFIG EDITOR</span>
                <div class="cfg-header-actions">
                    <button class="cfg-btn-ghost" id="cfg-import">IMPORT</button>
                    <button class="cfg-btn-ghost" id="cfg-export">EXPORT</button>
                    <button class="cfg-btn-ghost" id="cfg-format">FORMAT</button>
                    <input type="file" id="cfg-file" accept="application/json,.json" hidden />
                </div>
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
                <span class="cfg-hint">⌘↩ apply &nbsp;·&nbsp; esc close</span>
                <div class="cfg-actions">
                    <button class="cfg-btn primary" id="cfg-apply">APPLY</button>
                    <button class="cfg-btn" id="cfg-close">CLOSE</button>
                </div>
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
    overlayEl.addEventListener("mousedown", (e) => { if (e.target === overlayEl) closeEditor(); });

    requestAnimationFrame(() => textarea.focus());
}

export function handleEditorKeys(e) {
    if (!overlayEl) return false;
    if (e.key === "Escape")             { closeEditor();               return true; }
    if (e.key === "Enter" && e.metaKey) { e.preventDefault(); pendingApply?.(); return true; }
    return false;
}
