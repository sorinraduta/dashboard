import { html, render } from "../vendor/lit-html.js";
import { injectStyles } from "./styles.js";
import { Panel } from "./panel.js";
import { openSheet } from "./sheet.js";
import { Icon } from "./icons.js";

/*
 * The month the way Horah draws one (`MonthView`): a ruled grid where the 1 px
 * gap *is* the line, today a filled accent disc, the week you are in tinted a
 * breath of the accent and its number named in it. Every other date is a plain
 * figure, the weekend and the days either side of the month quieter.
 */
const css = `
.calendar-panel {
    grid-column: 2;
    grid-row: 1 / 4;
    position: relative;
    overflow: hidden;
    container-type: inline-size;
    container-name: calendar;
}

.cal-grid {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
}

.cal-head,
.cal-days {
    display: grid;
    grid-template-columns: 2.2em repeat(7, 1fr);
}

.cal-head {
    flex-shrink: 0;
    padding-bottom: 6px;
}

.cal-days {
    flex: 1;
    min-height: 0;
    grid-template-rows: repeat(6, 1fr);
    gap: 1px;
    background: color-mix(in srgb, var(--color-text) 7%, transparent);
    border-radius: var(--radius-cell);
    overflow: hidden;
}

.cal-label {
    display: grid;
    place-items: center;
    font-size: var(--text-caption-2);
    font-weight: 590;
    color: color-mix(in srgb, var(--color-text) 34%, transparent);
}

.cal-week {
    display: grid;
    place-items: center;
    background: var(--color-surface);
    font-size: var(--text-caption-2);
    font-weight: 500;
    color: color-mix(in srgb, var(--color-text) 34%, transparent);
    font-variant-numeric: tabular-nums;
}

.cal-week.current {
    font-weight: 700;
    color: var(--color-accent);
}

.cal-cell {
    display: grid;
    place-items: center;
    min-width: 0;
    min-height: 0;
    background: var(--color-surface);
    transition: background var(--dur-fast);
}

.cal-cell.current-week {
    background: color-mix(in srgb, var(--color-accent) 5%, var(--color-surface));
}

.cal-num {
    width: 1.9em;
    height: 1.9em;
    display: grid;
    place-items: center;
    border-radius: var(--radius-pill);
    font-size: clamp(var(--text-caption-1), 3cqi, var(--text-callout));
    font-weight: 500;
    font-variant-numeric: tabular-nums;
    color: color-mix(in srgb, var(--color-text) 56%, transparent);
}

.cal-cell.weekend .cal-num {
    color: color-mix(in srgb, var(--color-text) 38%, transparent);
}

.cal-cell.adjacent .cal-num {
    font-weight: 400;
    color: color-mix(in srgb, var(--color-text) 26%, transparent);
}

.cal-cell.today .cal-num {
    background: var(--color-accent);
    color: var(--on-accent);
    font-weight: 700;
}

@media (hover: hover) {
    .cal-cell:hover {
        background: color-mix(in srgb, var(--color-text) 6%, var(--color-surface));
    }
}

@media (max-width: 900px) {
    .calendar-panel {
        grid-column: 1 / -1;
        grid-row: auto;
        min-height: 260px;
    }
}

/* ── The sheet: the month at full size ─────────────────── */
.cx-nav {
    display: flex;
    align-items: center;
    gap: 8px;
}

.cx-month-label {
    min-width: 10ch;
    text-align: center;
    font-size: var(--text-headline);
    font-weight: 590;
    color: var(--color-text);
}

.cx-body {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    padding: 12px 12px 12px;
}

.cx-body .cal-head {
    grid-template-columns: 3.2em repeat(7, 1fr);
    padding-bottom: 8px;
}

.cx-body .cal-label {
    font-size: var(--text-footnote);
}

.cx-body .cal-days {
    grid-template-columns: 3.2em repeat(7, 1fr);
}

/* Level with the dates: the centre of a 1.9em disc at the title-3 size, 8 px down. */
.cx-body .cal-week {
    font-size: var(--text-footnote);
    place-items: start center;
    padding-top: 19px;
}

/* A big cell carries its date at the top, as every month grid does. */
.cx-body .cal-cell {
    place-items: start center;
    padding-top: 8px;
}

.cx-body .cal-num {
    font-size: var(--text-title-3);
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

    // Always emit a full 6x7 grid, padded with the surrounding months' days, so
    // the layout never leaves empty rows showing the grid's background.
    const cells = [];
    for (let i = 0; i < 42; i++) {
        const date = new Date(year, month, 1 - firstWeekday + i);
        cells.push({ date, adjacent: date.getMonth() !== month });
    }

    const weeks = [];
    for (let i = 0; i < cells.length; i += 7) {
        const row = cells.slice(i, i + 7);
        // Every day in a Mon–Sun row belongs to the same ISO week.
        weeks.push({ weekNumber: getISOWeek(row[0].date), days: row });
    }
    return weeks;
}

function monthLabel(year, month) {
    return new Date(year, month, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function dayKey(d) {
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

// The weekday letters over the grid, and the six ruled weeks under them.
function monthGrid(year, month) {
    const weeks = buildMonthWeeks(year, month);
    const todayKey = dayKey(new Date());

    return html`
        <div class="cal-head">
            <div class="cal-label"></div>
            ${WEEKDAY_SHORT.map((w) => html`<div class="cal-label">${w}</div>`)}
        </div>
        <div class="cal-days">
            ${weeks.map((week) => {
                const current = week.days.some(({ date }) => dayKey(date) === todayKey);
                return html`
                    <div class="cal-week ${current ? "current" : ""}">${week.weekNumber}</div>
                    ${week.days.map(({ date, adjacent }, weekday) => {
                        const isWeekend = weekday === 5 || weekday === 6;
                        const isToday = dayKey(date) === todayKey;
                        return html`<div class="cal-cell ${isWeekend ? "weekend" : ""} ${adjacent ? "adjacent" : ""} ${isToday ? "today" : ""} ${current ? "current-week" : ""}"><span class="cal-num">${date.getDate()}</span></div>`;
                    })}
                `;
            })}
        </div>
    `;
}

function tick() {
    const now = new Date();
    document.querySelectorAll(".cal-clock").forEach((el) => { el.textContent = formatClock(now); });
}

// ── Fullscreen expanded view ───────────────────────────── */
let expanded = null;
let viewYear = null;
let viewMonth = null;

function renderExpandedGrid() {
    if (!expanded) return;
    const body = expanded.sheet.querySelector(".cx-body");
    if (body) render(monthGrid(viewYear, viewMonth), body);
    const label = expanded.sheet.querySelector(".cx-month-label");
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
    if (!expanded) return;
    expanded.close();
    expanded = null;
}

export function openCalendarExpanded() {
    if (expanded) { closeExpanded(); return; }

    const now = new Date();
    viewYear = now.getFullYear();
    viewMonth = now.getMonth();

    expanded = openSheet({
        className: "cx-sheet",
        bodyClass: "cx-fullscreen-open",
        onKey: onExpandedKey,
        onDismiss: closeExpanded,
    });
    render(html`
        <div class="sheet-bar">
            <div class="sheet-titlegroup">
                <span class="sheet-title">Calendar</span>
                <span class="sheet-sub cal-clock">${formatClock(now)}</span>
            </div>
            <div class="cx-nav">
                <button class="sheet-btn om-icon" title="Previous month (←)" aria-label="Previous month" @click=${() => shiftMonth(-1)}>
                    ${Icon("chevronLeft", { size: 18, stroke: 2.2 })}
                </button>
                <span class="cx-month-label">${monthLabel(viewYear, viewMonth)}</span>
                <button class="sheet-btn om-icon" title="Next month (→)" aria-label="Next month" @click=${() => shiftMonth(1)}>
                    ${Icon("chevronRight", { size: 18, stroke: 2.2 })}
                </button>
                <button class="sheet-btn sheet-word om-icon" @click=${goToday}>Today</button>
            </div>
            <div class="sheet-actions">
                <button class="sheet-btn om-icon" title="Minimize (Esc)" aria-label="Minimize" @click=${closeExpanded}>
                    ${Icon("minimize", { size: 17, stroke: 2 })}
                </button>
            </div>
        </div>
        <div class="cx-body sheet-cell"></div>
    `, expanded.sheet);

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
                <span class="panel-heading">
                    <span>Calendar</span>
                    <span class="panel-count cal-clock">${formatClock(now)}</span>
                </span>
                <span class="panel-actions">
                    <button class="panel-btn om-icon" title="Expand (L)" @click=${openCalendarExpanded}>
                        ${Icon("maximize", { size: 16 })}
                    </button>
                </span>
            `,
            className: "calendar-panel",
        },
        html`<div class="cal-grid">${monthGrid(now.getFullYear(), now.getMonth())}</div>`,
    );
}
