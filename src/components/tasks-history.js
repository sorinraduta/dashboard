import { html, render } from "../vendor/lit-html.js";
import { injectStyles } from "./styles.js";
import { getQuestHistory, toggleHistoryItemAt } from "./quests.js";
import { Icon } from "./icons.js";

/*
 * The history is one grouped list: a day per row, opaque on the sheet's glass,
 * separated by hairlines inset to where the words start. A day's tasks are
 * chips — the accent's wash for one that was done, the plain wash for one that
 * was not — and a press on either turns it over.
 */
const css = `
.hist-list {
    padding: 0 16px;
    --rule-inset: 0px;
}

.hist-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 160px;
    padding: 0 24px;
    color: var(--label-3);
    font-size: var(--text-subhead);
    line-height: 1.5;
    text-align: center;
}

.hist-day {
    padding: 12px 0 14px;
}

.hist-day-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 8px;
}

.hist-date {
    font-size: var(--text-body);
    font-weight: 590;
    color: var(--color-text);
}

.hist-date .dow {
    margin-left: 6px;
    font-weight: 400;
    color: var(--label-2);
}

.hist-count {
    flex-shrink: 0;
    font-size: var(--text-subhead);
    color: var(--label-2);
    font-variant-numeric: tabular-nums;
}

.hist-count.zero {
    color: var(--label-3);
}

/* Part of a whole: a stadium, the accent for what was done. */
.hist-bar {
    height: 4px;
    margin-bottom: 10px;
    border-radius: var(--radius-pill);
    background: var(--fill);
    overflow: hidden;
}

.hist-bar > span {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: var(--color-accent);
    transition: width var(--dur-base) var(--ease-glide);
}

.hist-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

.hist-tag {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    height: 28px;
    padding: 0 11px;
    border-radius: var(--radius-pill);
    background: var(--fill);
    color: var(--label-2);
    font-size: var(--text-footnote);
    white-space: nowrap;
    cursor: pointer;
    user-select: none;
}

.hist-tag.done {
    background: color-mix(in srgb, var(--color-accent) 18%, transparent);
    color: var(--accent-ink);
}

@media (hover: hover) {
    .hist-tag:hover {
        background: var(--fill-strong);
        color: var(--color-text);
    }

    .hist-tag.done:hover {
        background: color-mix(in srgb, var(--color-accent) 28%, transparent);
        color: var(--accent-ink);
    }
}
`;

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

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
    return html`
        <div class="hist-day">
            <div class="hist-day-head">
                <span class="hist-date">${main}<span class="dow">${dow}</span></span>
                <span class="hist-count ${rec.completed === 0 ? "zero" : ""}">${rec.completed}/${rec.total}</span>
            </div>
            <div class="hist-bar"><span style="width:${pct}%"></span></div>
            <div class="hist-tags">
                ${rec.items.map((it, i) => html`
                    <span class="hist-tag om-chip ${it.done ? "done" : "miss"}" role="button" tabindex="0"
                          title="Toggle" data-date=${rec.date} data-idx=${i}
                    >${it.done ? Icon("check", { size: 12, stroke: 2.8 }) : ""}${it.label}</span>
                `)}
            </div>
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
    render(
        records.length
            ? html`<div class="sheet-cell"><div class="hist-list om-wbs">${records.map(dayRow)}</div></div>`
            : html`<div class="sheet-cell hist-empty">No history yet. Finish a quest to start tracking your days.</div>`,
        container,
    );
    bindToggle(container);
}
