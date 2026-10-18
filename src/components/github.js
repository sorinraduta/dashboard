import { html, render } from "../vendor/lit-html.js";
import { injectStyles } from "./styles.js";
import { Panel } from "./panel.js";
import { getConfig } from "../config-store.js";
import { Icon } from "./icons.js";
import { removeAfterDeparture } from "./sheet.js";
const config = getConfig();

const css = `
.github-panel {
    grid-column: 1;
    grid-row: 3;
}

.gh-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
}

#gh-container {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

/*
 * The graph takes the room the panel has. A day is as wide as the weeks allow
 * and as tall as that, unless the panel is too short for seven of those — then
 * it is as tall as a seventh of what there is, and the graph still ends level
 * with the footer instead of under it.
 */
.gh-fit {
    flex: 1;
    min-height: 0;
    container-type: size;
}

.gh-grid {
    --day: min(
        calc((100cqw - (var(--weeks) - 1) * 2px) / var(--weeks)),
        calc((100cqh - 12px) / 7)
    );
    display: flex;
    flex-direction: column;
    gap: 2px;
    width: 100%;
}

.gh-row {
    display: flex;
    gap: 2px;
    height: var(--day);
}

/* Six shades of one accent, the way Horah draws a scale: nothing, then deeper. */
.gh-cell {
    flex: 1 1 0;
    min-width: 0;
    border-radius: var(--radius-tick);
    background: var(--fill);
}

.gh-cell.l1 { background: color-mix(in srgb, var(--color-accent) 28%, var(--color-surface)); }
.gh-cell.l2 { background: color-mix(in srgb, var(--color-accent) 50%, var(--color-surface)); }
.gh-cell.l3 { background: color-mix(in srgb, var(--color-accent) 75%, var(--color-surface)); }
.gh-cell.l4 { background: var(--color-accent); }

@media (hover: hover) {
    .gh-cell:hover {
        box-shadow: inset 0 0 0 1px var(--label-2);
    }
}

/* A floating surface, so glass: it arrives on scale and opacity while its centring keeps the transform. */
.gh-tooltip {
    position: fixed;
    z-index: 10000;
    pointer-events: none;
    opacity: 0;
    scale: 0.96;
    transform: translate(-50%, calc(-100% - 10px));
    transition:
        opacity var(--dur-fast) var(--ease-gentle),
        scale var(--dur-fast) var(--ease-spring);
    padding: 7px 11px;
    border-radius: var(--radius-control);
    white-space: nowrap;
}

.gh-tooltip.visible {
    opacity: 1;
    scale: 1;
}

.gh-tooltip-count {
    font-size: var(--text-footnote);
    font-weight: 590;
    color: var(--color-text);
}

.gh-tooltip-date {
    margin-top: 1px;
    font-size: var(--text-caption-1);
    color: var(--label-2);
    font-variant-numeric: tabular-nums;
}

.gh-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.gh-stat {
    font-size: var(--text-footnote);
    color: var(--label-2);
}

.gh-stats-val {
    font-weight: 590;
    color: var(--color-text);
    font-variant-numeric: tabular-nums;
}

/*
 * **The day's nudge**, a toast: a capsule of glass held off the top edge, the
 * red in its dot alone. It arrives like glass and leaves the way it came.
 */
.gh-alert {
    position: fixed;
    top: 16px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1002;
    display: flex;
    align-items: center;
    gap: 10px;
    height: 44px;
    padding: 0 6px 0 16px;
    border-radius: var(--radius-pill);
    font-size: var(--text-subhead);
    font-weight: 590;
    color: var(--color-text);
    animation: omGlassIn var(--dur-base) var(--ease-spring) backwards;
}

.gh-alert[data-away] {
    pointer-events: none;
    animation: omGlassOut var(--dur-base) var(--ease-spring-back) forwards;
}

.gh-alert-dot {
    width: 8px;
    height: 8px;
    border-radius: var(--radius-pill);
    background: var(--red);
    flex-shrink: 0;
}

.gh-alert-close {
    width: 32px;
    height: 32px;
    display: grid;
    place-items: center;
    padding: 0;
    border: 0;
    border-radius: var(--radius-pill);
    background: var(--fill);
    color: var(--label-2);
    cursor: pointer;
}

body.cx-fullscreen-open .gh-alert,
body.qx-fullscreen-open .gh-alert {
    display: none;
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
        ghTooltipEl.className = "gh-tooltip om-glass";
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
            <div class="gh-fit"><div class="gh-grid" style="--weeks: ${weeks.length}">${rows}</div></div>
            <div class="gh-footer">
                <span class="gh-stat"><span class="gh-stats-val">${totalContributions.toLocaleString("en-US")}</span> contributions</span>
                <span class="gh-stat"><span class="gh-stats-val">${activeDays}</span> active days</span>
            </div>
        `,
        container,
    );
}

let ghAlertEl = null;

function dismissAlert() {
    const el = ghAlertEl;
    if (!el) return;
    ghAlertEl = null;
    el.dataset.away = "";
    removeAfterDeparture(el);
}

function showNoCommitsAlert() {
    if (ghAlertEl) return;
    ghAlertEl = document.createElement("div");
    ghAlertEl.className = "gh-alert om-glass";
    ghAlertEl.setAttribute("role", "status");
    render(html`
        <span class="gh-alert-dot"></span>
        <span>No GitHub commits today</span>
        <button class="gh-alert-close om-icon" title="Dismiss" aria-label="Dismiss" @click=${dismissAlert}>
            ${Icon("x", { size: 15, stroke: 2.2 })}
        </button>
    `, ghAlertEl);
    document.body.appendChild(ghAlertEl);
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
                <span>GitHub</span>
                <a href="https://github.com/${GITHUB_USER}" target="_blank" class="panel-link om-icon" title="Open profile (G)">@${GITHUB_USER}</a>
            `,
            className: "github-panel",
        },
        html`
            <div class="gh-wrapper">
                <div class="panel-note" id="gh-loading">Loading…</div>
                <div id="gh-container"></div>
            </div>
        `,
    );
}
