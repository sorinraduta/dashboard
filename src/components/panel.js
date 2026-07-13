import { html } from "../vendor/lit-html.js";
import { injectStyles } from "./styles.js";

const css = `
.panel {
    background: var(--panel-bg);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 10px 12px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.panel-title {
    color: var(--accent);
    font-size: 0.67rem;
    letter-spacing: 0.15em;
    border-bottom: 1px solid var(--border);
    padding-bottom: 5px;
    margin-bottom: 8px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
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
