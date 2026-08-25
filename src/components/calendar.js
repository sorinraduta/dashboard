import { html, render } from "../vendor/lit-html.js";
import { injectStyles } from "./styles.js";
import { Panel } from "./panel.js";

const css = `
.calendar-panel {
    grid-column: 2;
    grid-row: 1 / 4;
    position: relative;
    overflow: hidden;
    container-type: inline-size;
    container-name: calendar;
}

.cal-titlegroup {
    display: flex;
    align-items: center;
    gap: 8px;
}

.cal-clock {
    font-size: 0.72rem;
    color: var(--accent);
    letter-spacing: 0.1em;
    font-variant-numeric: tabular-nums;
}

.cal-maximize {
    background: transparent;
    border: none;
    color: var(--dim);
    cursor: pointer;
    padding: 0 2px;
    line-height: 0;
    transition: color 0.15s;
}
.cal-maximize:hover { color: var(--accent); }

.cal-grid {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
}

.cal-days {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: 2em repeat(7, 1fr);
    grid-template-rows: auto repeat(6, 1fr);
    gap: 1px;
    background: var(--border);
    border: 1px solid var(--border);
    border-radius: 5px;
    overflow: hidden;
}

.cal-cell {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: clamp(0.62rem, 2.4cqi, 0.85rem);
    color: var(--text);
    background: var(--panel-bg);
}

.cal-label {
    font-size: clamp(0.5rem, 1.8cqi, 0.6rem);
    color: var(--dim);
    letter-spacing: 0.08em;
    background: color-mix(in srgb, var(--border) 40%, var(--panel-bg));
    padding: 5px 0;
}

.cal-cell.weekend {
    color: var(--dim);
}

.cal-cell.today {
    background: color-mix(in srgb, var(--accent) 16%, var(--panel-bg));
    color: var(--accent);
    font-weight: 500;
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--accent) 45%, transparent);
}

.cal-cell.day {
    transition: background 0.1s, color 0.1s;
}

.cal-cell.day:hover {
    background: color-mix(in srgb, var(--accent) 12%, var(--panel-bg));
    color: var(--accent);
    cursor: default;
}

.cal-cell.day.today:hover {
    background: color-mix(in srgb, var(--accent) 26%, var(--panel-bg));
}

@container calendar (max-width: 340px) {
    .cal-label {
        letter-spacing: 0;
    }
}

@media (max-width: 900px) {
    .calendar-panel {
        grid-column: 1 / -1;
        grid-row: auto;
        padding: 18px 12px;
        min-height: 260px;
    }
}

/* ── Fullscreen expanded view ───────────────────────────── */
.cx-overlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
    background: var(--bg);
    display: flex;
    flex-direction: column;
    padding: 18px 22px;
    overflow: hidden;
    animation: cx-power-on 420ms steps(1, end);
}

.cx-overlay.cx-closing {
    animation: cx-power-off 140ms ease-in forwards;
}

.cx-overlay::before {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 5;
    background: repeating-linear-gradient(
        to bottom,
        rgba(74, 222, 128, 0.035) 0px,
        rgba(74, 222, 128, 0.035) 1px,
        transparent 1px,
        transparent 3px
    );
    mix-blend-mode: overlay;
}

.cx-sweep {
    position: absolute;
    left: 0;
    right: 0;
    height: 35%;
    z-index: 6;
    pointer-events: none;
    background: linear-gradient(to bottom, transparent, rgba(74, 222, 128, 0.16), transparent);
    animation: cx-sweep-move 500ms ease-out forwards;
}

@keyframes cx-power-on {
    0%   { opacity: 0; }
    12%  { opacity: 1; }
    20%  { opacity: 0.15; }
    28%  { opacity: 1; }
    38%  { opacity: 0.3; }
    50%  { opacity: 1; }
    100% { opacity: 1; }
}

@keyframes cx-power-off {
    to { opacity: 0; }
}

@keyframes cx-sweep-move {
    0%   { top: -35%; opacity: 1; }
    100% { top: 100%; opacity: 0; }
}

.cx-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--border);
    padding-bottom: 11px;
    margin-bottom: 14px;
    flex-shrink: 0;
    position: relative;
    z-index: 1;
}

.cx-titlegroup {
    display: flex;
    align-items: center;
    gap: 12px;
}

.cx-title {
    color: var(--accent);
    font-size: 0.8rem;
    letter-spacing: 0.15em;
    animation: cx-title-glitch 420ms steps(2, end);
}

@keyframes cx-title-glitch {
    0%   { text-shadow: none; }
    15%  { text-shadow: -2px 0 var(--accent2), 2px 0 var(--accent3); }
    30%  { text-shadow: 2px 0 var(--accent2), -2px 0 var(--accent3); }
    45%  { text-shadow: -1px 0 var(--accent2), 1px 0 var(--accent3); }
    60%  { text-shadow: 1px 0 var(--accent2), -1px 0 var(--accent3); }
    100% { text-shadow: none; }
}

.cx-clock {
    font-size: 0.72rem;
    color: var(--dim);
    letter-spacing: 0.1em;
    font-variant-numeric: tabular-nums;
}

.cx-nav {
    display: flex;
    align-items: center;
    gap: 10px;
}

.cx-nav-btn {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.7rem;
    padding: 3px 8px;
    border: 1px solid var(--border);
    border-radius: 3px;
    background: transparent;
    color: var(--dim);
    cursor: pointer;
    transition: all 0.15s;
}
.cx-nav-btn:hover { color: var(--accent); border-color: var(--accent); }

.cx-month-label {
    font-size: 0.68rem;
    letter-spacing: 0.1em;
    color: var(--text);
    min-width: 11ch;
    text-align: center;
}

.cx-close {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.6rem;
    letter-spacing: 0.05em;
    padding: 3px 10px;
    border: 1px solid var(--border);
    border-radius: 3px;
    background: transparent;
    color: var(--dim);
    cursor: pointer;
    transition: all 0.15s;
    display: flex;
    align-items: center;
    gap: 6px;
}
.cx-close:hover { color: var(--text); border-color: var(--text); }

.cx-body {
    flex: 1;
    min-height: 0;
    display: flex;
    justify-content: center;
    position: relative;
    z-index: 1;
}

.cx-days {
    flex: 1;
    max-width: 900px;
    display: grid;
    grid-template-columns: 3.2em repeat(7, 1fr);
    grid-template-rows: auto repeat(6, 1fr);
    gap: 1px;
    background: var(--border);
    border: 1px solid var(--border);
    border-radius: 5px;
    overflow: hidden;
}

.cx-days .cal-cell {
    font-size: clamp(0.9rem, 2vw, 1.5rem);
}

.cx-days .cal-label {
    font-size: clamp(0.6rem, 1vw, 0.75rem);
}
`;

const WEEKDAY_SHORT = ["M", "T", "W", "T", "F", "S", "S"];

function pad(n) {
    return String(n).padStart(2, "0");
}

function formatClock(d) {
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ISO 8601 week number: weeks start Monday, week 1 contains the year's first Thursday.
function getISOWeek(d) {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = (date.getUTCDay() + 6) % 7;
    date.setUTCDate(date.getUTCDate() - dayNum + 3);
    const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
    const firstThursdayDay = (firstThursday.getUTCDay() + 6) % 7;
    firstThursday.setUTCDate(firstThursday.getUTCDate() - firstThursdayDay + 3);
    return 1 + Math.round((date - firstThursday) / (7 * 86400000));
}

function buildMonthWeeks(year, month) {
    // Convert JS getDay() (0=Sun..6=Sat) to a Monday-first index (0=Mon..6=Sun).
    const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells = [];
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    for (let day = 1; day <= daysInMonth; day++) cells.push(day);
    while (cells.length % 7 !== 0) cells.push(null);

    const weeks = [];
    for (let i = 0; i < cells.length; i += 7) {
        const row = cells.slice(i, i + 7);
        // Every day in a Mon–Sun row belongs to the same ISO week, so any
        // present day (real or padding-adjacent) gives the right week number.
        const sample = row.find((day) => day !== null);
        const weekNumber = sample != null ? getISOWeek(new Date(year, month, sample)) : null;
        weeks.push({ weekNumber, days: row });
    }
    return weeks;
}

function monthLabel(year, month) {
    return new Date(year, month, 1)
        .toLocaleDateString(undefined, { month: "long", year: "numeric" })
        .toUpperCase();
}

function monthGrid(year, month) {
    const weeks = buildMonthWeeks(year, month);
    const now = new Date();
    const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();
    const todayDate = now.getDate();

    return html`
        <div class="cal-cell cal-label"></div>
        ${WEEKDAY_SHORT.map((w) => html`<div class="cal-cell cal-label">${w}</div>`)}
        ${weeks.map((week) => html`
            <div class="cal-cell cal-label">${week.weekNumber ?? ""}</div>
            ${week.days.map((day, weekday) => {
                if (day === null) return html`<div class="cal-cell"></div>`;
                const isWeekend = weekday === 5 || weekday === 6;
                const isToday = isCurrentMonth && day === todayDate;
                return html`<div class="cal-cell day ${isWeekend ? "weekend" : ""} ${isToday ? "today" : ""}">${day}</div>`;
            })}
        `)}
    `;
}

function tick() {
    const now = new Date();
    document.querySelectorAll(".cal-clock").forEach((el) => { el.textContent = formatClock(now); });
}

// ── Fullscreen expanded view ───────────────────────────── */
let expandedEl = null;
let viewYear = null;
let viewMonth = null;

function renderExpandedGrid() {
    if (!expandedEl) return;
    const days = expandedEl.querySelector(".cx-days");
    if (days) render(monthGrid(viewYear, viewMonth), days);
    const label = expandedEl.querySelector(".cx-month-label");
    if (label) label.textContent = monthLabel(viewYear, viewMonth);
}

function shiftMonth(delta) {
    viewMonth += delta;
    if (viewMonth < 0) { viewMonth = 11; viewYear--; }
    else if (viewMonth > 11) { viewMonth = 0; viewYear++; }
    renderExpandedGrid();
}

function goToday() {
    const now = new Date();
    viewYear = now.getFullYear();
    viewMonth = now.getMonth();
    renderExpandedGrid();
}

function onExpandedKey(e) {
    if (e.key === "Escape") { e.preventDefault(); closeExpanded(); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); shiftMonth(-1); }
    else if (e.key === "ArrowRight") { e.preventDefault(); shiftMonth(1); }
}

function closeExpanded() {
    if (!expandedEl) return;
    const el = expandedEl;
    expandedEl = null;
    document.removeEventListener("keydown", onExpandedKey);
    el.classList.add("cx-closing");
    el.addEventListener("animationend", () => el.remove(), { once: true });
}

export function openCalendarExpanded() {
    if (expandedEl) { closeExpanded(); return; }

    const now = new Date();
    viewYear = now.getFullYear();
    viewMonth = now.getMonth();

    expandedEl = document.createElement("div");
    expandedEl.className = "cx-overlay";
    expandedEl.innerHTML = `
        <div class="cx-sweep"></div>
        <div class="cx-header">
            <div class="cx-titlegroup">
                <span class="cx-title">// CALENDAR</span>
                <span class="cx-clock cal-clock">${formatClock(now)}</span>
            </div>
            <div class="cx-nav">
                <button class="cx-nav-btn" id="cx-prev">‹</button>
                <span class="cx-month-label">${monthLabel(viewYear, viewMonth)}</span>
                <button class="cx-nav-btn" id="cx-next">›</button>
                <button class="cx-nav-btn" id="cx-today">TODAY</button>
            </div>
            <button class="cx-close" id="cx-close">MINIMIZE ⤡</button>
        </div>
        <div class="cx-body">
            <div class="cx-days"></div>
        </div>
    `;
    document.body.appendChild(expandedEl);
    expandedEl.querySelector("#cx-close").addEventListener("click", closeExpanded);
    expandedEl.querySelector("#cx-prev").addEventListener("click", () => shiftMonth(-1));
    expandedEl.querySelector("#cx-next").addEventListener("click", () => shiftMonth(1));
    expandedEl.querySelector("#cx-today").addEventListener("click", goToday);
    expandedEl.querySelector(".cx-sweep").addEventListener("animationend", (e) => e.target.remove(), { once: true });
    document.addEventListener("keydown", onExpandedKey);

    renderExpandedGrid();
}

export function CalendarPanel() {
    injectStyles("calendar", css);
    queueMicrotask(() => {
        tick();
        setInterval(tick, 1000);
    });

    const now = new Date();

    return Panel(
        {
            title: html`
                <span class="cal-titlegroup">
                    <span>// CALENDAR</span>
                    <span class="cal-clock">${formatClock(now)}</span>
                </span>
                <button class="cal-maximize" title="Expand" @click=${openCalendarExpanded}>
                    <svg viewBox="0 0 16 16" width="11" height="11" fill="none"
                         stroke="currentColor" stroke-width="1.6"
                         stroke-linecap="round" stroke-linejoin="round">
                        <path d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4" />
                    </svg>
                </button>
            `,
            className: "calendar-panel",
        },
        html`
            <div class="cal-grid">
                <div class="cal-days">
                    ${monthGrid(now.getFullYear(), now.getMonth())}
                </div>
            </div>
        `,
    );
}
