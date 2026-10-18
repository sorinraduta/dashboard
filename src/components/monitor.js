import { html, render } from "../vendor/lit-html.js";
import { injectStyles } from "./styles.js";
import { Panel } from "./panel.js";
import { createDraggable } from "./draggable.js";
import { getConfig } from "../config-store.js";
const config = getConfig();

/*
 * A service is a tile: the plain wash on the panel, its glyph, its name, and
 * whether it answers — a dot of green or red with the word beside it in the
 * quieter ink. The colour is the dot's alone.
 */
const css = `
.monitor-panel {
    grid-column: 2;
    grid-row: 4 / 6;
}

.monitor-sections {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
}

/* A group's caption, as Horah heads one. */
.monitor-section-label {
    padding: 0 2px 6px;
    font-size: var(--text-footnote);
    font-weight: 590;
    letter-spacing: -0.005em;
    color: var(--label-2);
}

.svc-grid + .monitor-section-label {
    padding-top: 14px;
}

.svc-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(136px, 1fr));
    gap: 8px;
    align-content: start;
}

.svc-card {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    padding: 12px 12px 10px;
    border-radius: var(--radius-cell);
    background: var(--fill);
    text-decoration: none;
    color: var(--color-text);
    cursor: grab;
}

.svc-icon {
    width: 22px;
    height: 22px;
    margin-bottom: 8px;
    color: var(--label-2);
    transition: color var(--dur-fast);
}

@media (hover: hover) {
    .svc-card:hover .svc-icon {
        color: var(--color-accent);
    }
}

.svc-card-name {
    max-width: 100%;
    font-size: var(--text-subhead);
    font-weight: 590;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.svc-card-footer {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: var(--text-footnote);
    color: var(--label-2);
}

.svc-dot {
    width: 7px;
    height: 7px;
    border-radius: var(--radius-pill);
    flex-shrink: 0;
    transition: background var(--dur-base) var(--ease-gentle);
}

.svc-dot.online {
    background: var(--green);
}

.svc-dot.offline {
    background: var(--red);
}

.svc-dot.checking {
    background: var(--label-3);
}
`;

const pihole = html`<svg class="svc-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="4.5" y1="12" x2="19.5" y2="12"/><line x1="12" y1="4" x2="12" y2="20"/></svg>`;

const jellyfin = html`<svg class="svc-icon" viewBox="0 0 512 512" fill="currentColor"><path d="M256 40c-22 0-62 77-101 148C111 268 66 352 66 395c0 53 85 77 190 77s190-24 190-77c0-43-45-127-89-207C318 117 278 40 256 40zm0 56c13 0 41 55 72 113 40 74 80 152 80 186 0 28-60 51-152 51S104 423 104 395c0-34 40-112 80-186 31-58 59-113 72-113z"/></svg>`;

const homeassistant = html`<svg class="svc-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M21.8 13.1l-1.3-1.3-8.5-8.5-8.5 8.5-1.3 1.3 1.4 1.4.6-.6V21h6v-5h3v5h6v-7.1l.6.6 1-1.4zM18 19h-3v-5H9v5H6v-8.6l6-6 6 6V19z"/></svg>`;

const grafana = html`<svg class="svc-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12.16 1c-.26 1.63-.77 2.76-1.54 3.8C9.44 6.54 7.82 7.6 6.8 9.5c-1.6 2.96-.76 6.76 1.97 8.7 1.06.74 1.96 1.05 2.93 1.2-.62-.78-1.02-1.78-.92-2.95.18-2.08 1.68-3.3 2.58-5.18.2-.4.34-.82.4-1.27.35 1.04.2 2.1-.12 3.12-.55 1.72-.35 2.6.37 3.72.5.78 1.26 1.37 2.17 1.7 1.7.6 3.5.3 4.85-.77-1.12.2-2.2-.1-2.78-1.08-.48-.82-.38-1.7.02-2.53.3-.6.77-1.06 1.17-1.6.56-.76.8-1.6.6-2.53-.12-.5-.38-.95-.67-1.37l-.26.56c-.3.5-.72.85-1.3.98-.74.14-1.36-.1-1.87-.63-.56-.58-.73-1.3-.52-2.08.18-.67.56-1.2 1.05-1.64.77-.7 1.38-1.5 1.6-2.56.06-.3.08-.6.07-.9 0-.43-.08-.85-.24-1.25-.32-.77-.84-1.3-1.58-1.6C13.94.78 13.08.73 12.16 1z"/></svg>`;

const web = html`<svg class="svc-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`;

const nas = html`<svg class="svc-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="12" x2="2" y2="12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/><line x1="6" y1="16" x2="6.01" y2="16"/><line x1="10" y1="16" x2="10.01" y2="16"/></svg>`;

// Horah's own mark: the dial of hours with one of them kept (horah/apps/web/src/components/HorahMark.tsx).
const horah = html`<svg class="svc-icon" viewBox="156 156 712 712" fill="none" stroke="currentColor"><path d="M805.4 449.6A300 300 0 1 1 553.8 214.9" stroke-opacity="0.72" stroke-width="54" stroke-linecap="round"/><path d="M614.6 230.1A300 300 0 0 1 786.1 390" stroke-width="112"/></svg>`;

const icons = { pihole, jellyfin, web, homeassistant, nas, grafana, horah };

const STATUS_WORD = { online: "Online", offline: "Offline", checking: "Checking" };

/* ── Two independent lists ─────────────────────────────────── */
const WEB_KEY = "monitor-websites-order";
const SVC_KEY = "monitor-services-order";

function loadAndApplyOrder(defaults, key) {
    try {
        const saved = JSON.parse(localStorage.getItem(key));
        if (Array.isArray(saved) && saved.length) {
            const map = new Map(defaults.map((s) => [s.name, s]));
            const ordered = [];
            for (const name of saved) {
                if (map.has(name)) { ordered.push(map.get(name)); map.delete(name); }
            }
            for (const s of map.values()) ordered.push(s);
            return ordered;
        }
    } catch {}
    return defaults;
}

let websites = loadAndApplyOrder(config.monitor.websites, WEB_KEY);
let servicesList = loadAndApplyOrder(config.monitor.local, SVC_KEY);

const status = new Map([...websites, ...servicesList].map((s) => [s.name, "checking"]));

/* ── Draggable instances (fully independent) ───────────────── */
const webDrag = createDraggable({
    getItems: () => websites,
    onReorder: (arr) => { websites = arr; localStorage.setItem(WEB_KEY, JSON.stringify(arr.map((s) => s.name))); },
    render: () => renderMonitor(),
});

const svcDrag = createDraggable({
    getItems: () => servicesList,
    onReorder: (arr) => { servicesList = arr; localStorage.setItem(SVC_KEY, JSON.stringify(arr.map((s) => s.name))); },
    render: () => renderMonitor(),
});

function renderSection(drag) {
    return drag.displayItems().map((s, displayIdx) => {
        return html`
            <a
                href=${s.url}
                target="_blank"
                class="svc-card om-tile ${drag.classFor(displayIdx)}"
                draggable="true"
                @dragstart=${(e) => drag.start(e, displayIdx)}
                @dragend=${(e) => drag.end(e)}
                @dragover=${(e) => drag.over(e, displayIdx)}
                @drop=${(e) => drag.drop(e, displayIdx)}
                @click=${(e) => { if (drag.active) e.preventDefault(); }}
            >
                ${icons[s.icon] ?? web}
                <span class="svc-card-name">${s.name}</span>
                <span class="svc-card-footer">
                    <span class="svc-dot ${status.get(s.name)}"></span>
                    ${STATUS_WORD[status.get(s.name)]}
                </span>
            </a>
        `;
    });
}

function renderMonitor() {
    const container = document.getElementById("monitor-container");
    if (!container) return;

    // A group with nothing in it is left out, caption and all.
    render(
        html`
            ${websites.length ? html`
                <div class="monitor-section-label">Websites</div>
                <div class="svc-grid">${renderSection(webDrag)}</div>
            ` : ""}
            ${servicesList.length ? html`
                <div class="monitor-section-label">Services</div>
                <div class="svc-grid">${renderSection(svcDrag)}</div>
            ` : ""}
        `,
        container,
    );
}

async function checkService(svc) {
    try {
        await fetch(svc.check, { mode: "no-cors", cache: "no-store" });
        status.set(svc.name, "online");
    } catch {
        status.set(svc.name, "offline");
    }
    renderMonitor();
}

async function checkAll() {
    await Promise.allSettled([...websites, ...servicesList].map(checkService));
}

export function MonitorPanel() {
    injectStyles("monitor", css);
    queueMicrotask(() => {
        renderMonitor();
        checkAll();
        setInterval(checkAll, 60000);
    });
    return Panel(
        { title: "Monitor", className: "monitor-panel" },
        html`<div class="monitor-sections" id="monitor-container"></div>`,
    );
}
