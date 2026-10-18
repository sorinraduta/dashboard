import { html, render } from "../vendor/lit-html.js";
import { injectStyles } from "./styles.js";
import { Panel } from "./panel.js";
import { createDraggable } from "./draggable.js";
import { getConfig } from "../config-store.js";
const config = getConfig();

/* A link is a tile in the plain wash; its colour lives in the swatch beside the name. */
const css = `
.links-panel {
    grid-column: 3;
    grid-row: 5 / 6;
}

.link-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
    gap: 6px;
    overflow-y: auto;
}

.link-item {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    height: 34px;
    padding: 0 10px;
    border-radius: var(--radius-cell);
    background: var(--fill);
    font-size: var(--text-footnote);
    font-weight: 590;
    text-decoration: none;
    color: var(--color-text);
    white-space: nowrap;
    cursor: grab;
}

.link-label {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
}

.link-dot {
    width: 8px;
    height: 8px;
    border-radius: var(--radius-pill);
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
                        class="link-item om-tile ${drag.classFor(displayIdx)}"
                        draggable="true"
                        @dragstart=${(e) => drag.start(e, displayIdx)}
                        @dragend=${(e) => drag.end(e)}
                        @dragover=${(e) => drag.over(e, displayIdx)}
                        @drop=${(e) => drag.drop(e, displayIdx)}
                        @click=${(e) => { if (drag.active) e.preventDefault(); }}
                    >
                        <span class="link-dot" style="background: ${l.color}"></span><span class="link-label">${l.label}</span>
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
        { title: "Links", className: "links-panel" },
        html`<div class="link-grid" id="link-grid"></div>`,
    );
}
