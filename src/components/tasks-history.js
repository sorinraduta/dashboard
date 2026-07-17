import { injectStyles } from "./styles.js";
import { getQuestHistory, toggleHistoryItemAt } from "./quests.js";

const css = `
.hist-list {
    display: flex;
    flex-direction: column;
}

.hist-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-height: 120px;
    color: var(--dim);
    font-size: 0.64rem;
    letter-spacing: 0.05em;
    text-align: center;
    padding: 0 24px;
    line-height: 1.7;
}

.hist-day {
    padding: 10px 4px;
    border-bottom: 1px solid var(--border);
}
.hist-day:last-child { border-bottom: none; }

.hist-day-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 7px;
}

.hist-date {
    font-size: 0.66rem;
    color: var(--text);
    letter-spacing: 0.03em;
}
.hist-date .dow { color: var(--dim); margin-left: 6px; }

.hist-count {
    font-size: 0.6rem;
    color: var(--accent);
    flex-shrink: 0;
}
.hist-count.zero { color: var(--dim); }

.hist-bar {
    height: 3px;
    border-radius: 2px;
    background: var(--border);
    overflow: hidden;
    margin-bottom: 9px;
}
.hist-bar > span {
    display: block;
    height: 100%;
    background: var(--accent);
}

.hist-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
}

.hist-tag {
    font-size: 0.56rem;
    letter-spacing: 0.02em;
    padding: 2px 8px;
    border-radius: 3px;
    border: 1px solid var(--border);
    color: var(--dim);
    white-space: nowrap;
    cursor: pointer;
    user-select: none;
    transition: border-color 0.15s, color 0.15s;
}
.hist-tag:hover {
    border-color: var(--accent);
    color: var(--text);
}
.hist-tag.done:hover {
    color: var(--accent);
}
.hist-tag.done {
    color: var(--accent);
    border-color: color-mix(in srgb, var(--accent) 45%, transparent);
    background: color-mix(in srgb, var(--accent) 8%, transparent);
}
.hist-tag.done::before { content: "✓ "; }
.hist-tag.miss::before { content: "· "; }
`;

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function escHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escAttr(s) {
    return escHtml(s).replace(/"/g, "&quot;");
}

function formatDate(ts) {
    const d = new Date(ts);
    return {
        main: `${MON[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`,
        dow: DOW[d.getDay()],
    };
}

function dayRow(rec) {
    const pct = rec.total ? Math.round((rec.completed / rec.total) * 100) : 0;
    const { main, dow } = formatDate(rec.ts);
    const tags = rec.items
        .map((it, i) =>
            `<span class="hist-tag ${it.done ? "done" : "miss"}" role="button" tabindex="0" title="Toggle" data-date="${escAttr(rec.date)}" data-idx="${i}">${escHtml(it.label)}</span>`
        )
        .join("");
    return `
        <div class="hist-day">
            <div class="hist-day-head">
                <span class="hist-date">${main}<span class="dow">${dow}</span></span>
                <span class="hist-count ${rec.completed === 0 ? "zero" : ""}">${rec.completed}/${rec.total}</span>
            </div>
            <div class="hist-bar"><span style="width:${pct}%"></span></div>
            <div class="hist-tags">${tags}</div>
        </div>
    `;
}

// Delegate clicks/keys on the container to the tag under the cursor, toggling
// that day's item. Bound once per container so repeated renders don't stack it.
function bindToggle(container) {
    if (container.__histBound) return;
    container.__histBound = true;
    const fire = (target) => {
        const tag = target.closest?.(".hist-tag");
        if (!tag || !container.contains(tag)) return;
        const idx = Number(tag.dataset.idx);
        if (!tag.dataset.date || Number.isNaN(idx)) return;
        toggleHistoryItemAt(tag.dataset.date, idx);
    };
    container.addEventListener("click", (e) => fire(e.target));
    container.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fire(e.target); }
    });
}

// Render the task-history list (newest first) into the given container element.
export function renderHistory(container) {
    injectStyles("tasks-history", css);
    const records = getQuestHistory();
    container.innerHTML = records.length
        ? `<div class="hist-list">${records.map(dayRow).join("")}</div>`
        : `<div class="hist-empty">No task history yet.<br/>Complete a task to start tracking your days.</div>`;
    bindToggle(container);
}
