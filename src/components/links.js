import { html, render } from "../vendor/lit-html.js";
import { injectStyles } from "./styles.js";
import { Panel } from "./panel.js";
import { createDraggable } from "./draggable.js";
import { getConfig } from "../config-store.js";
const config = getConfig();

const css = `
.links-panel {
    grid-column: 3;
    grid-row: 5 / 6;
}

.link-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
}

.link-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 7px 8px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 3px;
    font-size: 0.68rem;
    text-decoration: none;
    color: var(--text);
    transition: all 0.15s;
    white-space: nowrap;
    cursor: grab;
}

.link-item:hover {
    border-color: var(--accent);
    color: var(--accent);
}

.link-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    flex-shrink: 0;
}
`;

const DEFAULT_LINKS = config.links;

const STORAGE_KEY = "links-order";

function getOrderedLinks() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (Array.isArray(saved) && saved.length) {
            const map = new Map(DEFAULT_LINKS.map((l) => [l.label, l]));
            const ordered = [];
            for (const label of saved) {
                if (map.has(label)) { ordered.push(map.get(label)); map.delete(label); }
            }
            for (const l of map.values()) ordered.push(l);
            return ordered;
        }
    } catch {}
    return [...DEFAULT_LINKS];
}

let links = getOrderedLinks();

const drag = createDraggable({
    getItems: () => links,
    onReorder: (arr) => {
        links = arr;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(arr.map((l) => l.label)));
    },
    render: () => renderLinks(),
});

function renderLinks() {
    const grid = document.getElementById("link-grid");
    if (!grid) return;

    render(
        html`
            ${drag.displayItems().map((l, displayIdx) => {
                return html`
                    <a
                        href=${l.href}
                        target="_blank"
                        class="link-item ${drag.classFor(displayIdx)}"
                        draggable="true"
                        @dragstart=${(e) => drag.start(e, displayIdx)}
                        @dragend=${(e) => drag.end(e)}
                        @dragover=${(e) => drag.over(e, displayIdx)}
                        @drop=${(e) => drag.drop(e, displayIdx)}
                        @click=${(e) => { if (drag.active) e.preventDefault(); }}
                    >
                        <span class="link-dot" style="background: ${l.color}"></span>${l.label}
                    </a>
                `;
            })}
        `,
        grid,
    );
}

export function LinksPanel() {
    injectStyles("links", css);
    queueMicrotask(() => renderLinks());
    return Panel(
        { title: "// LINKS", className: "links-panel" },
        html`<div class="link-grid" id="link-grid"></div>`,
    );
}
