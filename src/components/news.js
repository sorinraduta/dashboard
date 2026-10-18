import { html, render } from "../vendor/lit-html.js";
import { injectStyles } from "./styles.js";
import { Panel } from "./panel.js";
import { Icon } from "./icons.js";

const css = `
.news-panel {
    grid-column: 3;
    grid-row: 1 / 4;
}

.news-list {
    flex: 1;
    min-height: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    --rule-inset: 8px;
    --rule-end: 8px;
}

/* A story is a two-line row: the title, and under it the byline in the quieter ink. */
.news-item {
    padding: 8px;
    margin: 0 -8px;
    border-radius: var(--radius-group);
}

.news-item-title {
    display: block;
    font-size: var(--text-subhead);
    line-height: 1.3;
    color: var(--color-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-decoration: none;
}

.news-item-info {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    margin-top: 2px;
    font-size: var(--text-footnote);
    color: var(--label-2);
    font-variant-numeric: tabular-nums;
}

.news-item-info a {
    color: inherit;
    text-decoration: none;
    transition: color var(--dur-fast);
}

@media (hover: hover) {
    .news-item-info a:hover {
        color: var(--color-accent);
    }
}
`;

const HN_API = "https://hacker-news.firebaseio.com/v0";
const HN_URL = "https://news.ycombinator.com";

export function openHackerNews() {
    window.open(HN_URL, "_blank");
}

async function fetchTopStories() {
    const res = await fetch(`${HN_API}/topstories.json`);
    const ids = await res.json();
    const stories = await Promise.all(
        ids.slice(0, 10).map((id) =>
            fetch(`${HN_API}/item/${id}.json`).then((r) => r.json()),
        ),
    );
    return stories;
}

function timeAgo(unix) {
    const secs = Math.floor((Date.now() - unix * 1000) / 1000);
    if (secs < 60) return `${secs}s ago`;
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

function renderStories(stories) {
    const list = document.getElementById("news-list");
    const loading = document.getElementById("news-loading");
    if (!list) return;
    if (loading) loading.style.display = "none";
    render(
        html`${stories.map(
            (s) => html`
                <div class="news-item om-list-row">
                    <a href=${s.url || `https://news.ycombinator.com/item?id=${s.id}`} target="_blank" class="news-item-title">${s.title}</a>
                    <div class="news-item-info">
                        <span><a href="https://news.ycombinator.com/user?id=${s.by}" target="_blank">${s.by}</a> · ${timeAgo(s.time)}</span>
                        <a href="https://news.ycombinator.com/item?id=${s.id}" target="_blank">${s.descendants ?? 0} comments</a>
                    </div>
                </div>
            `,
        )}`,
        list,
    );
}

export function NewsPanel() {
    injectStyles("news", css);
    queueMicrotask(async () => {
        const stories = await fetchTopStories();
        renderStories(stories);
    });
    return Panel(
        {
            title: html`
                <span>News</span>
                <a href=${HN_URL} target="_blank" class="panel-btn om-icon" title="Open Hacker News (N)" aria-label="Open Hacker News">
                    ${Icon("arrowUpRight", { size: 18 })}
                </a>
            `,
            className: "news-panel",
        },
        html`
            <div class="panel-note" id="news-loading">Loading…</div>
            <div class="news-list om-wbs" id="news-list"></div>
        `,
    );
}
