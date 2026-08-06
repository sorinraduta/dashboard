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
    container-type: inline-size;
    container-name: clock;
}

.clock-panel .panel-title {
    display: none;
}

.time-display {
    /* Never wrap — when it no longer fits, the seconds are dropped instead. */
    white-space: nowrap;
    font-size: clamp(2rem, 11cqi, 5.5rem);
    color: var(--accent);
    letter-spacing: 0.15em;
    line-height: 1;
    font-weight: 300;
    font-variant-numeric: tabular-nums;
    max-width: 100%;
}

.date-display {
    font-size: clamp(0.6rem, 4cqi, 0.72rem);
    color: var(--dim);
    margin-top: 10px;
    letter-spacing: 0.12em;
    max-width: 100%;
    overflow-wrap: anywhere;
}

/* Anything short of a comfortable full-size clock loses the seconds. */
@container clock (max-width: 640px) {
    .time-display .sep-sec,
    .time-display #time-ss {
        display: none;
    }
}

@media (max-width: 900px) {
    .clock-panel {
        grid-column: 1 / -1;
        grid-row: auto;
        padding: 18px 12px;
    }
}
`;

const DAYS = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

function pad(n) {
    return String(n).padStart(2, "0");
}

function timeParts(d) {
    return [pad(d.getHours()), pad(d.getMinutes()), pad(d.getSeconds())];
}

function formatDate(d) {
    return `${DAYS[d.getDay()]} // ${pad(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function tick() {
    const now = new Date();
    const [hh, mm, ss] = timeParts(now);
    const set = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    };
    set("time-hh", hh);
    set("time-mm", mm);
    set("time-ss", ss);
    set("date", formatDate(now));
}

export function ClockPanel() {
    injectStyles("clock", css);
    queueMicrotask(() => {
        tick();
        setInterval(tick, 1000);
    });
    const now = new Date();
    const [hh, mm, ss] = timeParts(now);
    return Panel(
        { title: html``, className: "clock-panel" },
        html`
            <div class="time-display" id="time"><span id="time-hh">${hh}</span>:<span
                    id="time-mm">${mm}</span><span class="sep-sec">:</span><span id="time-ss">${ss}</span></div>
            <div class="date-display" id="date">${formatDate(now)}</div>
        `,
    );
}
