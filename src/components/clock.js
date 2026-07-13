import { html } from "../vendor/lit-html.js";
import { injectStyles } from "./styles.js";
import { Panel } from "./panel.js";

const css = `
.clock-panel {
    grid-column: 2;
    grid-row: 1 / 4;
    align-items: center;
    justify-content: center;
    text-align: center;
    position: relative;
    overflow: hidden;
}

.clock-panel .panel-title {
    display: none;
}

.time-display {
    font-size: 5.5rem;
    color: var(--accent);
    letter-spacing: 0.15em;
    line-height: 1;
    font-weight: 300;
    font-variant-numeric: tabular-nums;
}

.date-display {
    font-size: 0.72rem;
    color: var(--dim);
    margin-top: 10px;
    letter-spacing: 0.12em;
}
`;

const DAYS = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

function pad(n) {
    return String(n).padStart(2, "0");
}

function formatTime(d) {
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function formatDate(d) {
    return `${DAYS[d.getDay()]} // ${pad(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function tick() {
    const now = new Date();
    const timeEl = document.getElementById("time");
    const dateEl = document.getElementById("date");
    if (timeEl) timeEl.textContent = formatTime(now);
    if (dateEl) dateEl.textContent = formatDate(now);
}

export function ClockPanel() {
    injectStyles("clock", css);
    queueMicrotask(() => {
        tick();
        setInterval(tick, 1000);
    });
    const now = new Date();
    return Panel(
        { title: html``, className: "clock-panel" },
        html`
            <div class="time-display" id="time">${formatTime(now)}</div>
            <div class="date-display" id="date">${formatDate(now)}</div>
        `,
    );
}
