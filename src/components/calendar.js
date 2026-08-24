import { html } from "../vendor/lit-html.js";
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

.cal-clock {
    font-size: 0.72rem;
    color: var(--accent);
    letter-spacing: 0.1em;
    font-variant-numeric: tabular-nums;
}

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
    background: var(--accent);
    color: var(--bg);
    font-weight: 500;
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

function buildMonthWeeks(d) {
    const year = d.getFullYear();
    const month = d.getMonth();
    const today = d.getDate();
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
    return { weeks, today };
}

function tick() {
    const now = new Date();
    const clockEl = document.getElementById("cal-clock");
    if (clockEl) clockEl.textContent = formatClock(now);
}

export function CalendarPanel() {
    injectStyles("calendar", css);
    queueMicrotask(() => {
        tick();
        setInterval(tick, 1000);
    });

    const now = new Date();
    const { weeks, today } = buildMonthWeeks(now);

    return Panel(
        {
            title: html`
                <span>// CALENDAR</span>
                <span class="cal-clock" id="cal-clock">${formatClock(now)}</span>
            `,
            className: "calendar-panel",
        },
        html`
            <div class="cal-grid">
                <div class="cal-days">
                    <div class="cal-cell cal-label"></div>
                    ${WEEKDAY_SHORT.map((w) => html`<div class="cal-cell cal-label">${w}</div>`)}
                    ${weeks.map((week) => html`
                        <div class="cal-cell cal-label">${week.weekNumber ?? ""}</div>
                        ${week.days.map((day, weekday) => {
                            if (day === null) return html`<div class="cal-cell"></div>`;
                            const isWeekend = weekday === 5 || weekday === 6;
                            const isToday = day === today;
                            return html`<div class="cal-cell ${isWeekend ? "weekend" : ""} ${isToday ? "today" : ""}">${day}</div>`;
                        })}
                    `)}
                </div>
            </div>
        `,
    );
}
