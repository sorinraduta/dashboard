import { html } from "../vendor/lit-html.js";
import { injectStyles } from "./styles.js";

/*
 * A panel is content, not a floating surface, so it is opaque: Horah's
 * `--color-surface` card on the black page, the way iOS sets a grouped cell on
 * its background. Glass is kept for what floats over the panels.
 */
const css = `
.panel {
    background: var(--color-surface);
    border-radius: var(--radius-sheet);
    padding: 10px 14px 14px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    min-height: 0;
}

.panel-title {
    flex-shrink: 0;
    min-height: 32px;
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    font-size: var(--text-headline);
    font-weight: 650;
    letter-spacing: -0.02em;
    color: var(--color-text);
}

/* The title and the figure beside it, which sits in the quieter ink every count in Horah wears. */
.panel-heading {
    display: flex;
    align-items: baseline;
    gap: 8px;
    min-width: 0;
}

.panel-count {
    font-size: var(--text-subhead);
    font-weight: 400;
    letter-spacing: -0.01em;
    color: color-mix(in srgb, var(--color-text) 38%, transparent);
    font-variant-numeric: tabular-nums;
}

.panel-actions {
    display: flex;
    align-items: center;
    gap: 2px;
    margin-right: -6px;
}

/* An icon in a panel's corner: a quiet glyph whose press washes a circle round it. */
.panel-btn {
    width: 32px;
    height: 32px;
    display: grid;
    place-items: center;
    padding: 0;
    border: 0;
    border-radius: var(--radius-pill);
    background: transparent;
    color: var(--label-2);
    cursor: pointer;
    text-decoration: none;
}

.panel-link {
    font-size: var(--text-footnote);
    font-weight: 400;
    letter-spacing: -0.005em;
    color: var(--label-2);
    text-decoration: none;
    padding: 5px 10px;
    margin-right: -4px;
    border-radius: var(--radius-pill);
}

@media (hover: hover) {
    .panel-btn:hover,
    .panel-link:hover {
        color: var(--color-text);
    }
}

/* What a panel says while it has nothing to show yet. */
.panel-note {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--text-footnote);
    color: var(--label-3);
}
`;

export function Panel({ title, className = "" }, ...children) {
    injectStyles("panel", css);
    return html`
        <div class="panel ${className}">
            <div class="panel-title">${title}</div>
            ${children}
        </div>
    `;
}
