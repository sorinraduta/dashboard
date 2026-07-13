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
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 10px;
}

.wisdom-loading {
    font-size: 0.67rem;
    color: var(--dim);
    line-height: 1.6;
}

.wisdom-quote {
    font-size: 0.7rem;
    color: var(--text);
    line-height: 1.6;
    font-style: italic;
}

.wisdom-author {
    font-size: 0.63rem;
    color: var(--accent);
    text-align: right;
}

.wisdom-author a {
    color: var(--accent);
    text-decoration: none;
    transition: color 0.2s;
}

.wisdom-author a:hover {
    color: var(--dim);
    text-decoration: underline;
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
        if (quoteEl) quoteEl.textContent = `"${data.quote}"`;
        if (authorEl) {
            render(
                html`— <a href="https://duckduckgo.com/?q=${encodeURIComponent(data.author)}" target="_blank" title="Search author">${data.author}</a>`,
                authorEl,
            );
        }
    });
    return Panel(
        { title: "// WISDOM", className: "wisdom-panel" },
        html`
            <div class="wisdom-body">
                <div class="wisdom-loading" id="wisdom-loading">// loading...</div>
                <div class="wisdom-quote" id="wisdom-quote"></div>
                <div class="wisdom-author" id="wisdom-author"></div>
            </div>
        `,
    );
}
