import { html, render } from "../vendor/lit-html.js";
import { injectStyles } from "./styles.js";
import { Panel } from "./panel.js";
import { getConfig } from "../config-store.js";
const config = getConfig();

const css = `
.github-panel {
    grid-column: 1;
    grid-row: 3;
    display: flex;
    flex-direction: column;
}

.gh-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-height: 0;
    overflow: hidden;
}

.gh-grid {
    display: flex;
    flex-direction: column;
    gap: 2px;
    overflow: hidden;
    width: 100%;
}

.gh-row {
    display: flex;
    gap: 2px;
}

.gh-cell {
    flex: 1 1 0;
    min-width: 0;
    aspect-ratio: 1;
    border-radius: 2px;
    background: #161b22;
}

.gh-cell.l1 { background: #0e4429; }
.gh-cell.l2 { background: #006d32; }
.gh-cell.l3 { background: #26a641; }
.gh-cell.l4 { background: #39d353; }

.gh-cell:hover {
    filter: brightness(1.4);
    outline: 1px solid rgba(255,255,255,0.15);
    outline-offset: -1px;
}

.gh-tooltip {
    position: fixed;
    z-index: 10000;
    pointer-events: none;
    opacity: 0;
    transform: translate(-50%, calc(-100% - 10px));
    transition: opacity 0.12s ease;
    padding: 6px 8px;
    background: var(--panel-bg);
    border: 1px solid var(--border);
    border-radius: 4px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.45);
    font-size: 0.58rem;
    line-height: 1.35;
    white-space: nowrap;
    color: var(--text);
}

.gh-tooltip.visible {
    opacity: 1;
}

.gh-tooltip-count {
    color: var(--accent);
}

.gh-tooltip-date {
    color: var(--dim);
    font-size: 0.52rem;
    margin-top: 2px;
}

.gh-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 2px;
}

.gh-stat {
    font-size: 0.5rem;
    color: var(--dim);
}

.gh-stats-val {
    color: var(--accent);
}

.gh-loading {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--dim);
    font-size: 0.68rem;
}

.gh-alert {
    position: fixed;
    top: 14px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1002;
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 7px 14px;
    background: var(--panel-bg);
    border: 1px solid var(--accent2);
    border-radius: 5px;
    box-shadow: 0 8px 30px rgba(244, 63, 94, 0.25);
    font-size: 0.62rem;
    letter-spacing: 0.04em;
    color: var(--accent2);
    animation: gh-alert-pulse 2.4s ease-in-out infinite;
}

.gh-alert-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--accent2);
    flex-shrink: 0;
    animation: gh-alert-blink 1.2s ease-in-out infinite;
}

.gh-alert-close {
    background: transparent;
    border: none;
    color: var(--accent2);
    cursor: pointer;
    font-size: 0.68rem;
    line-height: 1;
    padding: 0 2px;
    opacity: 0.7;
}
.gh-alert-close:hover { opacity: 1; }

@keyframes gh-alert-pulse {
    0%, 100% { box-shadow: 0 8px 30px rgba(244, 63, 94, 0.25); }
    50%      { box-shadow: 0 8px 34px rgba(244, 63, 94, 0.45); }
}

@keyframes gh-alert-blink {
    0%, 100% { opacity: 1; }
    50%      { opacity: 0.25; }
}
`;

const GITHUB_USER = config.github.user;
const WEEKS = config.github.weeks;

async function fetchContributions() {
    const dataByDate = {};
    // The rolling `?y=last` window ends *yesterday*, so today is never in it.
    // Fetch the current and previous calendar years instead — that includes
    // today (with its real count, 0 if no commits) and still covers the graph's
    // rolling window, which reaches back at most a few months.
    const year = new Date().getFullYear();
    try {
        const results = await Promise.all(
            [year, year - 1].map((y) =>
                fetch(
                    `https://github-contributions-api.jogruber.de/v4/${encodeURIComponent(GITHUB_USER)}?y=${y}`,
                ).then((r) => (r.ok ? r.json() : null)),
            ),
        );
        for (const data of results) {
            for (const row of data?.contributions || []) {
                dataByDate[row.date] = { level: row.level, count: row.count };
            }
        }
    } catch {}
    return dataByDate;
}

function buildGrid(dataByDate) {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const totalDays = WEEKS * 7 + dayOfWeek + 1;

    const days = [];
    for (let i = totalDays - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        const { level = 0, count = 0 } = dataByDate[key] || {};
        days.push({ date: key, count, level, day: d.getDay() });
    }

    const weeks = [];
    let currentWeek = new Array(7).fill(null);
    for (const d of days) {
        currentWeek[d.day] = d;
        if (d.day === 6) {
            weeks.push(currentWeek);
            currentWeek = new Array(7).fill(null);
        }
    }
    if (currentWeek.some((c) => c !== null)) {
        weeks.push(currentWeek);
    }

    return { weeks, days };
}

function levelClass(lvl) {
    return lvl > 0 ? `l${lvl}` : "";
}

function formatGhDate(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    const dow = date.toLocaleDateString("en-US", { weekday: "short" });
    const day = String(d).padStart(2, "0");
    const month = String(m).padStart(2, "0");
    return `${dow}, ${day}.${month}.${y}`;
}

function contributionLine(count) {
    if (count === 0) return "No contributions";
    const noun = count === 1 ? "contribution" : "contributions";
    return `${count} ${noun}`;
}

let ghTooltipEl = null;

function ghTooltip() {
    if (!ghTooltipEl) {
        ghTooltipEl = document.createElement("div");
        ghTooltipEl.className = "gh-tooltip";
        ghTooltipEl.innerHTML = `<div class="gh-tooltip-count"></div><div class="gh-tooltip-date"></div>`;
        document.body.appendChild(ghTooltipEl);
    }
    return ghTooltipEl;
}

function showGhTooltip(e, cell) {
    if (!cell?.date) return;
    const tip = ghTooltip();
    tip.querySelector(".gh-tooltip-count").textContent = contributionLine(cell.count);
    tip.querySelector(".gh-tooltip-date").textContent = formatGhDate(cell.date);
    tip.classList.add("visible");
    moveGhTooltip(e);
}

function moveGhTooltip(e) {
    const tip = ghTooltipEl;
    if (!tip?.classList.contains("visible")) return;
    tip.style.left = `${e.clientX}px`;
    tip.style.top = `${e.clientY}px`;
}

function hideGhTooltip() {
    ghTooltipEl?.classList.remove("visible");
}

function renderGraph(commitsByDate) {
    const container = document.getElementById("gh-container");
    const loading = document.getElementById("gh-loading");
    if (!container) return;
    if (loading) loading.style.display = "none";

    const { weeks, days } = buildGrid(commitsByDate);
    const totalContributions = days.reduce((sum, d) => sum + d.count, 0);
    const activeDays = days.filter((d) => d.level > 0).length;

    const rows = [];
    for (let row = 0; row < 7; row++) {
        const cells = weeks.map((week) => {
            const cell = week[row];
            if (!cell) return html`<div class="gh-cell"></div>`;
            return html`<div
                class="gh-cell ${levelClass(cell.level)}"
                @mouseenter=${(e) => showGhTooltip(e, cell)}
                @mousemove=${moveGhTooltip}
                @mouseleave=${hideGhTooltip}
            ></div>`;
        });
        rows.push(html`<div class="gh-row">${cells}</div>`);
    }

    render(
        html`
            <div class="gh-grid">${rows}</div>
            <div class="gh-footer">
                <span class="gh-stat"><span class="gh-stats-val">${totalContributions}</span> contributions</span>
                <span class="gh-stat"><span class="gh-stats-val">${activeDays}</span> active days</span>
            </div>
        `,
        container,
    );
}

let ghAlertEl = null;

function showNoCommitsAlert() {
    if (ghAlertEl) return;
    ghAlertEl = document.createElement("div");
    ghAlertEl.className = "gh-alert";
    ghAlertEl.innerHTML = `
        <span class="gh-alert-dot"></span>
        <span>NO GITHUB COMMITS TODAY</span>
        <button class="gh-alert-close" title="Dismiss">×</button>
    `;
    document.body.appendChild(ghAlertEl);
    ghAlertEl.querySelector(".gh-alert-close").addEventListener("click", () => {
        ghAlertEl.remove();
        ghAlertEl = null;
    });
}

export function openGithubProfile() {
    window.open(`https://github.com/${GITHUB_USER}`, "_blank");
}

export function GithubPanel() {
    injectStyles("github", css);
    queueMicrotask(async () => {
        const data = await fetchContributions();
        renderGraph(data);

        // Only alert when the fetch actually succeeded — an empty result from a
        // failed request shouldn't look like a "no commits" day.
        if (Object.keys(data).length) {
            // Local date (not UTC) so "today" matches the user's own day.
            const now = new Date();
            const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
            if ((data[todayKey]?.count ?? 0) === 0) showNoCommitsAlert();
        }
    });
    return Panel(
        {
            title: html`
                <span>// GITHUB</span>
                <a href="https://github.com/${GITHUB_USER}" target="_blank" style="font-size:0.58rem;color:var(--dim);text-decoration:none;transition:color 0.2s;">@${GITHUB_USER}</a>
            `,
            className: "github-panel",
        },
        html`
            <div class="gh-wrapper">
                <div class="gh-loading" id="gh-loading">// loading...</div>
                <div id="gh-container"></div>
            </div>
        `,
    );
}
