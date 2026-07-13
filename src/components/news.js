import { html, render } from "../vendor/lit-html.js";
import { injectStyles } from "./styles.js";
import { Panel } from "./panel.js";

const css = `
.news-panel {
    grid-column: 3;
    grid-row: 1 / 4;
}

.news-visit-btn {
    font-size: 0.6rem;
    color: var(--dim);
    text-decoration: none;
    letter-spacing: 0.1em;
    border: 1px solid var(--border);
    padding: 2px 7px;
    border-radius: 2px;
    transition:
        color 0.2s,
        border-color 0.2s;
}

.news-visit-btn:hover {
    color: var(--accent);
    border-color: var(--accent);
}

.news-loading {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--dim);
    font-size: 0.68rem;
}

.news-list {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.news-item {
    padding: 6px 0;
    border-bottom: 1px solid var(--border);
}

.news-item:last-child {
    border-bottom: none;
}

.news-item-title {
    display: block;
    font-size: 0.7rem;
    color: var(--text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-decoration: none;
    transition: color 0.2s;
}

.news-item-title:hover {
    color: var(--accent);
}

.news-item-info {
    display: flex;
    justify-content: space-between;
    font-size: 0.58rem;
    color: var(--dim);
    margin-top: 3px;
}

.news-item-info a {
    color: var(--dim);
    text-decoration: none;
    transition: color 0.2s;
}

.news-item-info a:hover {
    color: var(--accent);
}

.news-item-author {
    color: var(--accent) !important;
    text-decoration: none;
    font-size: 0.58rem;
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
                <div class="news-item">
                    <a href=${s.url || `https://news.ycombinator.com/item?id=${s.id}`} target="_blank" class="news-item-title">${s.title}</a>
                    <div class="news-item-info">
                        <span><a href="https://news.ycombinator.com/user?id=${s.by}" target="_blank" class="news-item-author">${s.by}</a> · ${timeAgo(s.time)}</span>
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
                <span>// NEWS</span>
                <a href=${HN_URL} target="_blank" class="news-visit-btn">VISIT ↗</a>
            `,
            className: "news-panel",
        },
        html`
            <div class="news-loading" id="news-loading">// loading...</div>
            <div class="news-list" id="news-list"></div>
        `,
    );
}
