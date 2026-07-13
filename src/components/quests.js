import { html, render } from "../vendor/lit-html.js";
import { injectStyles } from "./styles.js";
import { Panel } from "./panel.js";
import { createDraggable } from "./draggable.js";
import { getConfig } from "../config-store.js";
import { renderHistory } from "./tasks-history.js";
const config = getConfig();

const css = `
.quests-panel {
    grid-column: 1;
    grid-row: 1 / 3;
}

.quests-progress {
    font-size: 0.6rem;
    color: var(--dim);
    letter-spacing: 0;
}

.quest-item {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 0.66rem;
    padding: 4px 0;
    border-bottom: 1px solid var(--border);
    user-select: none;
    cursor: grab;
    transition: all 0.15s;
}

.quest-item:last-child {
    border-bottom: none;
}

.quest-item:hover {
    color: var(--accent);
}

.quest-check {
    flex-shrink: 0;
    color: var(--dim);
    cursor: pointer;
    transition: color 0.2s;
}

.quest-check:hover {
    color: var(--accent);
}

.quest-item.done .quest-check {
    color: var(--accent);
}

.quest-label {
    flex: 1;
    line-height: 1.3;
}

.quest-label a {
    color: inherit;
    text-decoration: none;
}

.quest-label a:hover {
    color: var(--accent);
}

.quest-item.done .quest-label {
    color: var(--dim);
    text-decoration: line-through;
}

.quest-item.done .quest-label a {
    border-bottom: none;
}

.quest-streak {
    flex-shrink: 0;
    font-size: 0.56rem;
    color: var(--accent3);
}

.quest-streak.none {
    color: var(--dim);
}

.quests-titlegroup {
    display: flex;
    align-items: center;
    gap: 8px;
}

.quests-maximize {
    background: transparent;
    border: none;
    color: var(--dim);
    cursor: pointer;
    padding: 0 2px;
    line-height: 0;
    transition: color 0.15s;
}
.quests-maximize:hover { color: var(--accent); }

/* ── Fullscreen expanded view ───────────────────────────── */
.qx-overlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
    background: var(--bg);
    display: flex;
    flex-direction: column;
    padding: 18px 22px;
    overflow: hidden;
    animation: qx-power-on 420ms steps(1, end);
}

.qx-overlay.qx-closing {
    animation: qx-power-off 140ms ease-in forwards;
}

.qx-overlay::before {
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

.qx-sweep {
    position: absolute;
    left: 0;
    right: 0;
    height: 35%;
    z-index: 6;
    pointer-events: none;
    background: linear-gradient(to bottom, transparent, rgba(74, 222, 128, 0.16), transparent);
    animation: qx-sweep-move 500ms ease-out forwards;
}

@keyframes qx-power-on {
    0%   { opacity: 0; }
    12%  { opacity: 1; }
    20%  { opacity: 0.15; }
    28%  { opacity: 1; }
    38%  { opacity: 0.3; }
    50%  { opacity: 1; }
    100% { opacity: 1; }
}

@keyframes qx-power-off {
    to { opacity: 0; }
}

@keyframes qx-sweep-move {
    0%   { top: -35%; opacity: 1; }
    100% { top: 100%; opacity: 0; }
}

.qx-header {
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

.qx-title {
    color: var(--accent);
    font-size: 0.8rem;
    letter-spacing: 0.15em;
    animation: qx-title-glitch 420ms steps(2, end);
}

@keyframes qx-title-glitch {
    0%   { text-shadow: none; }
    15%  { text-shadow: -2px 0 var(--accent2), 2px 0 var(--accent3); }
    30%  { text-shadow: 2px 0 var(--accent2), -2px 0 var(--accent3); }
    45%  { text-shadow: -1px 0 var(--accent2), 1px 0 var(--accent3); }
    60%  { text-shadow: 1px 0 var(--accent2), -1px 0 var(--accent3); }
    100% { text-shadow: none; }
}

.qx-close {
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
.qx-close:hover { color: var(--text); border-color: var(--text); }

.qx-body {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: minmax(260px, 360px) 1fr;
    gap: 26px;
    position: relative;
    z-index: 1;
}

.qx-col {
    min-height: 0;
    display: flex;
    flex-direction: column;
}

.qx-col-title {
    font-size: 0.62rem;
    letter-spacing: 0.12em;
    color: var(--dim);
    border-bottom: 1px solid var(--border);
    padding-bottom: 7px;
    margin-bottom: 10px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.qx-col-body {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding-right: 6px;
}

/* Larger, roomier task rows inside the expanded view */
.qx-col .quest-item { font-size: 0.72rem; padding: 6px 0; }
`;

const QUESTS_KEY = "quests";
const RESET_KEY = "quests-reset";
const STREAKS_KEY = "quests-streaks";
const STREAKS_DATE_KEY = "quests-streaks-date";
const STREAK_UNDO_KEY = "quests-streaks-undo";
const HISTORY_KEY = "quests-history";
const RESET_HOUR = config.quests.resetHour;
const RESET_MINUTE = config.quests.resetMinute;

const DEFAULT_QUESTS = config.quests.items.map((q) => ({ done: false, ...q }));

function getResetBoundary(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), RESET_HOUR, RESET_MINUTE).getTime();
}

function getLastResetBoundary() {
    const now = new Date();
    const today = getResetBoundary(now);
    return now.getTime() >= today ? today : today - 86400000;
}

function getPeriodDate(timestamp) {
    const d = new Date(timestamp);
    const boundary = getResetBoundary(d);
    if (d.getTime() >= boundary) return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const prev = new Date(d.getTime() - 86400000);
    return `${prev.getFullYear()}-${prev.getMonth()}-${prev.getDate()}`;
}

function getCurrentPeriodDate() {
    return getPeriodDate(Date.now());
}

function getYesterdayPeriodDate() {
    return getPeriodDate(Date.now() - 86400000);
}

function loadStreaks() {
    try {
        const saved = localStorage.getItem(STREAKS_KEY);
        if (saved) return JSON.parse(saved);
    } catch {}
    return {};
}

function loadStreakDates() {
    try {
        const saved = localStorage.getItem(STREAKS_DATE_KEY);
        if (saved) return JSON.parse(saved);
    } catch {}
    return {};
}

function saveStreaks(streaks) {
    localStorage.setItem(STREAKS_KEY, JSON.stringify(streaks));
}

function saveStreakDates(dates) {
    localStorage.setItem(STREAKS_DATE_KEY, JSON.stringify(dates));
}

// Snapshots of streak state captured the moment a check earns a point, so that
// unchecking the same task in the same period can revert it exactly.
function loadStreakUndo() {
    try {
        const saved = localStorage.getItem(STREAK_UNDO_KEY);
        if (saved) return JSON.parse(saved);
    } catch {}
    return {};
}

function saveStreakUndo(undo) {
    localStorage.setItem(STREAK_UNDO_KEY, JSON.stringify(undo));
}

function loadHistory() {
    try {
        const saved = localStorage.getItem(HISTORY_KEY);
        if (saved) return JSON.parse(saved);
    } catch {}
    return {};
}

// Reconstruct a Date from a "YYYY-M-D" period key (month is 0-indexed).
function periodToDate(periodDate) {
    const [y, m, d] = periodDate.split("-").map(Number);
    return new Date(y, m, d);
}

// Persist the results of a finished period so they can be shown in the history view.
function recordHistory(periodDate, prevQuests) {
    try {
        const history = loadHistory();
        history[periodDate] = {
            date: periodDate,
            ts: periodToDate(periodDate).getTime(),
            total: prevQuests.length,
            completed: prevQuests.filter((q) => q.done).length,
            items: prevQuests.map((q) => ({ label: q.label, done: !!q.done })),
        };
        // Keep the log bounded to the most recent year of entries.
        const keys = Object.keys(history).sort((a, b) => history[a].ts - history[b].ts);
        while (keys.length > 365) delete history[keys.shift()];
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch {}
}

// Public: history records, newest period first.
export function getQuestHistory() {
    const history = loadHistory();
    return Object.values(history).sort((a, b) => b.ts - a.ts);
}

function shouldReset() {
    const lastReset = parseInt(localStorage.getItem(RESET_KEY) || "0", 10);
    return lastReset < getLastResetBoundary();
}

function loadQuests() {
    if (shouldReset()) {
        try {
            const prev = localStorage.getItem(QUESTS_KEY);
            if (prev) {
                const prevQuests = JSON.parse(prev);

                const streaks = loadStreaks();
                const dates = loadStreakDates();
                const yesterday = getYesterdayPeriodDate();

                for (const q of prevQuests) {
                    const key = q.label;
                    if (q.done) {
                        const lastDate = dates[key] || "";
                        if (lastDate === yesterday || !streaks[key]) {
                            streaks[key] = (streaks[key] || 0) + 1;
                        }
                        dates[key] = getCurrentPeriodDate();
                    } else {
                        if (dates[key] !== yesterday) {
                            streaks[key] = 0;
                        }
                    }
                }
                saveStreaks(streaks);
                saveStreakDates(dates);
            }
        } catch {}

        localStorage.removeItem(QUESTS_KEY);
        localStorage.removeItem(STREAK_UNDO_KEY);
        localStorage.setItem(RESET_KEY, String(Date.now()));
        return DEFAULT_QUESTS.map((q) => ({ ...q }));
    }
    try {
        const saved = localStorage.getItem(QUESTS_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            const savedLabels = new Set(parsed.map((q) => q.label));
            const merged = parsed.map((q) => {
                const def = DEFAULT_QUESTS.find((d) => d.label === q.label);
                return def ? { ...q, url: def.url } : q;
            });
            for (const d of DEFAULT_QUESTS) {
                if (!savedLabels.has(d.label)) merged.push({ ...d });
            }
            return merged;
        }
    } catch {}
    return DEFAULT_QUESTS.map((q) => ({ ...q }));
}

function saveQuests(data) {
    localStorage.setItem(QUESTS_KEY, JSON.stringify(data));
}

let quests = loadQuests();

const drag = createDraggable({
    getItems: () => quests,
    onReorder: (arr) => { quests = arr; saveQuests(quests); },
    render: () => renderQuests(),
});

function updateProgress() {
    const done = quests.filter((q) => q.done).length;
    const text = `[${done}/${quests.length}]`;
    document.querySelectorAll(".quests-progress").forEach((el) => { el.textContent = text; });
}

function toggle(index) {
    quests[index].done = !quests[index].done;
    saveQuests(quests);

    const q = quests[index];
    const streaks = loadStreaks();
    const dates = loadStreakDates();
    const undo = loadStreakUndo();
    const today = getCurrentPeriodDate();
    const yesterday = getYesterdayPeriodDate();

    if (q.done) {
        // Earn a streak point once per period.
        if (dates[q.label] !== today) {
            // Remember the pre-credit state so an uncheck can fully revert it.
            undo[q.label] = { streak: streaks[q.label] || 0, date: dates[q.label] || "" };

            const lastDate = dates[q.label] || "";
            if (lastDate === yesterday || !streaks[q.label]) {
                streaks[q.label] = (streaks[q.label] || 0) + 1;
            } else {
                streaks[q.label] = 1;
            }
            dates[q.label] = today;
            saveStreaks(streaks);
            saveStreakDates(dates);
            saveStreakUndo(undo);
        }
    } else if (undo[q.label]) {
        // Unchecking reverts exactly the point this check earned this period.
        streaks[q.label] = undo[q.label].streak;
        dates[q.label] = undo[q.label].date;
        delete undo[q.label];
        saveStreaks(streaks);
        saveStreakDates(dates);
        saveStreakUndo(undo);
    }

    // Record the current period's progress live, so history reflects each toggle.
    recordHistory(today, quests);

    renderQuests();
    refreshExpandedHistory();
}

function renderQuests() {
    const lists = document.querySelectorAll(".quest-list");
    if (!lists.length) return;
    const streaks = loadStreaks();

    const tpl = html`${drag.displayItems().map((q, displayIdx) => {
        const actualIdx = quests.indexOf(q);
        const s = streaks[q.label] || 0;
        return html`
            <div class="quest-item ${q.done ? "done" : ""} ${drag.classFor(displayIdx)}"
                 draggable="true"
                 @dragstart=${(e) => drag.start(e, displayIdx)}
                 @dragend=${(e) => drag.end(e)}
                 @dragover=${(e) => drag.over(e, displayIdx)}
                 @drop=${(e) => drag.drop(e, displayIdx)}
                 @click=${(e) => { if (drag.active) e.preventDefault(); }}>
                <span class="quest-check" @click=${(e) => { e.stopPropagation(); toggle(actualIdx); }}>${q.done ? "[x]" : "[ ]"}</span>
                <span class="quest-label">${q.url ? html`<a href=${q.url} target="_blank">${q.label}</a>` : q.label}</span>
                <span class="quest-streak ${s === 0 ? "none" : ""}">${s > 0 ? `${s}d` : "0d"}</span>
            </div>
        `;
    })}`;

    lists.forEach((list) => render(tpl, list));
    updateProgress();
}

// ── Fullscreen expanded view (tasks + history) ──────────────
let expandedEl = null;

function refreshExpandedHistory() {
    const body = expandedEl?.querySelector(".qx-history-body");
    if (body) renderHistory(body);
}

function onExpandedKey(e) {
    if (e.key === "Escape") { e.preventDefault(); closeExpanded(); }
}

function closeExpanded() {
    if (!expandedEl) return;
    const el = expandedEl;
    expandedEl = null;
    document.removeEventListener("keydown", onExpandedKey);
    el.classList.add("qx-closing");
    el.addEventListener("animationend", () => el.remove(), { once: true });
    renderQuests();
}

export function openQuestsExpanded() {
    if (expandedEl) { closeExpanded(); return; }

    expandedEl = document.createElement("div");
    expandedEl.className = "qx-overlay";
    expandedEl.innerHTML = `
        <div class="qx-sweep"></div>
        <div class="qx-header">
            <span class="qx-title">// QUESTS</span>
            <button class="qx-close" id="qx-close">MINIMIZE ⤡</button>
        </div>
        <div class="qx-body">
            <div class="qx-col">
                <div class="qx-col-title">TODAY <span class="quests-progress"></span></div>
                <div class="qx-col-body"><div class="quest-list"></div></div>
            </div>
            <div class="qx-col">
                <div class="qx-col-title">HISTORY</div>
                <div class="qx-col-body qx-history-body"></div>
            </div>
        </div>
    `;
    document.body.appendChild(expandedEl);
    expandedEl.querySelector("#qx-close").addEventListener("click", closeExpanded);
    expandedEl.querySelector(".qx-sweep").addEventListener("animationend", (e) => e.target.remove(), { once: true });
    document.addEventListener("keydown", onExpandedKey);

    renderQuests();
    refreshExpandedHistory();
}

export function QuestsPanel() {
    injectStyles("quests", css);

    const done = quests.filter((q) => q.done).length;

    queueMicrotask(renderQuests);
    return Panel(
        {
            title: html`
                <span class="quests-titlegroup">
                    <span>// QUESTS</span>
                    <span class="quests-progress">[${done}/${quests.length}]</span>
                </span>
                <button class="quests-maximize" title="Expand" @click=${openQuestsExpanded}>
                    <svg viewBox="0 0 16 16" width="11" height="11" fill="none"
                         stroke="currentColor" stroke-width="1.6"
                         stroke-linecap="round" stroke-linejoin="round">
                        <path d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4" />
                    </svg>
                </button>
            `,
            className: "quests-panel",
        },
        html`<div class="quest-list"></div>`,
    );
}
