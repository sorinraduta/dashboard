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

.cal-date {
    font-size: clamp(0.85rem, 3cqi, 1.15rem);
    color: var(--text);
    letter-spacing: 0.08em;
    margin-bottom: 12px;
    flex-shrink: 0;
}

.cal-date .cal-day-name {
    color: var(--accent);
}

.cal-grid {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
}

.cal-weekdays,
.cal-days {
    display: grid;
    grid-template-columns: 1.8em repeat(7, 1fr);
}

.cal-weekdays {
    flex-shrink: 0;
    margin-bottom: 6px;
}

.cal-weekdays span {
    text-align: center;
    font-size: clamp(0.55rem, 2cqi, 0.65rem);
    color: var(--dim);
    letter-spacing: 0.1em;
}

.cal-days {
    flex: 1;
    grid-auto-rows: 1fr;
    gap: 3px;
}

.cal-cell {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: clamp(0.6rem, 2.4cqi, 0.85rem);
    color: var(--text);
    border-radius: 3px;
}

.cal-week-num {
    font-size: clamp(0.5rem, 1.8cqi, 0.62rem);
    color: var(--dim);
    border-right: 1px solid var(--border);
    margin-right: 2px;
}

.cal-cell.empty {
    visibility: hidden;
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
    .cal-weekdays span:nth-child(n) {
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

const DAYS = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
const WEEKDAY_SHORT = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

function pad(n) {
    return String(n).padStart(2, "0");
}

function formatClock(d) {
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDate(d) {
    return html`<span class="cal-day-name">${DAYS[d.getDay()]}</span> // ${pad(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
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
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells = [];
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    for (let day = 1; day <= daysInMonth; day++) cells.push(day);
    while (cells.length % 7 !== 0) cells.push(null);

    const weeks = [];
    for (let i = 0; i < cells.length; i += 7) {
        const row = cells.slice(i, i + 7);
        // Thursday (index 4) reliably falls in the same ISO week as the rest
        // of a Sun–Sat row. Falling back, prefer Mon–Sat (indices 1-6) over
        // the leading Sunday, which alone can spill into the prior ISO week.
        const sample = row[4] ?? row.slice(1).find((day) => day !== null) ?? row[0];
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
            <div class="cal-date">${formatDate(now)}</div>
            <div class="cal-grid">
                <div class="cal-weekdays">
                    <span></span>
                    ${WEEKDAY_SHORT.map((w) => html`<span>${w}</span>`)}
                </div>
                <div class="cal-days">
                    ${weeks.map((week) => html`
                        <div class="cal-cell cal-week-num">${week.weekNumber ?? ""}</div>
                        ${week.days.map((day, weekday) => {
                            if (day === null) return html`<div class="cal-cell empty"></div>`;
                            const isWeekend = weekday === 0 || weekday === 6;
                            const isToday = day === today;
                            return html`<div class="cal-cell ${isWeekend ? "weekend" : ""} ${isToday ? "today" : ""}">${day}</div>`;
                        })}
                    `)}
                </div>
            </div>
        `,
    );
}
