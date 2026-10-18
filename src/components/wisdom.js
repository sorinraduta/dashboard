import { html, render } from "../vendor/lit-html.js";
import { injectStyles } from "./styles.js";
import { Panel } from "./panel.js";

const css = `
.wisdom-panel {
    grid-column: 3;
    grid-row: 4 / 5;
}

.wisdom-body {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 8px;
}

.wisdom-quote {
    font-size: var(--text-subhead);
    line-height: 1.4;
    color: var(--color-text);
}

.wisdom-author {
    font-size: var(--text-footnote);
    color: var(--label-2);
    text-align: right;
}

.wisdom-author a {
    color: var(--color-accent);
    text-decoration: none;
}

@media (hover: hover) {
    .wisdom-author a:hover {
        text-decoration: underline;
    }
}
`;

async function fetchQuote() {
    const res = await fetch("https://dummyjson.com/quotes/random");
    return res.json();
}

export function WisdomPanel() {
    injectStyles("wisdom", css);
    queueMicrotask(async () => {
        const data = await fetchQuote();
        const quoteEl = document.getElementById("wisdom-quote");
        const authorEl = document.getElementById("wisdom-author");
        const loadingEl = document.getElementById("wisdom-loading");
        if (loadingEl) loadingEl.style.display = "none";
        if (quoteEl) quoteEl.textContent = `“${data.quote}”`;
        if (authorEl) {
            render(
                html`— <a href="https://duckduckgo.com/?q=${encodeURIComponent(data.author)}" target="_blank" title="Search author">${data.author}</a>`,
                authorEl,
            );
        }
    });
    return Panel(
        { title: "Wisdom", className: "wisdom-panel" },
        html`
            <div class="wisdom-body">
                <div class="panel-note" id="wisdom-loading">Loading…</div>
                <div class="wisdom-quote" id="wisdom-quote"></div>
                <div class="wisdom-author" id="wisdom-author"></div>
            </div>
        `,
    );
}
