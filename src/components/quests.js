import { html, render } from "../vendor/lit-html.js";
import { injectStyles } from "./styles.js";
import { Panel } from "./panel.js";
import { createDraggable } from "./draggable.js";
import { getConfig } from "../config-store.js";
import { renderHistory } from "./tasks-history.js";
import { openSheet } from "./sheet.js";
import { Icon } from "./icons.js";
const config = getConfig();

const css = `
.quests-panel {
    grid-column: 1;
    grid-row: 1 / 3;
}

/*
 * A quest is a row of a grouped list: the round check Horah marks a finished
 * task with, the words, and the streak at the far end. The rule between two
 * rows starts where the words do.
 */
.quest-list {
    --rule-inset: 40px;
    --rule-end: 8px;
}

.quest-item {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 40px;
    padding: 6px 8px;
    margin: 0 -8px;
    border-radius: var(--radius-group);
    font-size: var(--text-subhead);
    line-height: 1.3;
    user-select: none;
    cursor: grab;
    transition: background var(--dur-fast), filter var(--dur-base) var(--ease-gentle);
}

.quest-check {
    flex-shrink: 0;
    width: 22px;
    height: 22px;
    display: grid;
    place-items: center;
    padding: 0;
    border: 1.5px solid var(--label-3);
    border-radius: var(--radius-pill);
    background: transparent;
    color: var(--on-accent);
    cursor: pointer;
    transition:
        background var(--dur-fast) var(--ease-gentle),
        border-color var(--dur-fast) var(--ease-gentle),
        transform 0.14s cubic-bezier(0.3, 0.9, 0.3, 1);
}

.quest-check .icon {
    opacity: 0;
    scale: 0.6;
    transition: opacity var(--dur-fast), scale var(--dur-base) var(--ease-spring);
}

.quest-check:active {
    transform: scale(0.9);
}

.quest-item.done .quest-check {
    background: var(--color-accent);
    border-color: var(--color-accent);
}

.quest-item.done .quest-check .icon {
    opacity: 1;
    scale: 1;
}

.quest-label {
    flex: 1;
    min-width: 0;
    color: var(--color-text);
    transition: color var(--dur-fast);
}

.quest-label a {
    color: inherit;
    text-decoration: none;
}

.quest-item.done .quest-label {
    color: var(--label-3);
}

/* The glyph carries the colour; the figure stays on the text tokens. */
.quest-streak {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 3px;
    font-size: var(--text-footnote);
    color: var(--label-2);
    font-variant-numeric: tabular-nums;
}

.quest-streak .icon {
    color: var(--cal-orange);
}

.quest-streak.none,
.quest-streak.none .icon {
    color: var(--label-4);
}

@media (hover: hover) {
    .quest-check:hover {
        border-color: var(--color-accent);
    }

    .quest-label a:hover {
        color: var(--color-accent);
    }
}

/* ── Privacy: the words are blurred and nothing answers a press ── */
body.quests-private .quest-item {
    filter: blur(6px);
    cursor: default;
}

body.quests-private .quest-item,
body.quests-private .quest-item:hover,
body.quests-private .quest-item:active {
    background: transparent;
}

body.quests-private .quest-check {
    cursor: default;
    pointer-events: none;
}

body.quests-private .quest-label a {
    pointer-events: none;
    cursor: default;
}

.quests-privacy .icon-off,
.quests-privacy.active .icon-on {
    display: none;
}

.quests-privacy.active .icon-off {
    display: block;
}

.quests-privacy.active {
    color: var(--color-accent);
}

.quests-maximize.disabled {
    opacity: 0.35;
    cursor: default;
    pointer-events: none;
}

/* ── The sheet: today beside the history ───────────────── */
.qx-body {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: minmax(300px, 420px) 1fr;
    gap: 24px;
}

.qx-col {
    min-height: 0;
    display: flex;
    flex-direction: column;
}

.qx-col-body {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
}

.qx-col-body > .sheet-cell {
    padding: 4px 16px;
}

/* Roomier rows in the sheet: the body size, as a list on iOS is set. */
.qx-col .quest-item {
    min-height: 46px;
    font-size: var(--text-body);
}
`;

const QUESTS_KEY = "quests";
const RESET_KEY = "quests-reset";
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

function dateToPeriod(d) {
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

// A day only reaches the log once something is toggled on it, so days where
// nothing was completed leave a hole in the timeline. Build a stand-in record
// for those, using the task list carried over from the last recorded day.
function emptyRecord(periodDate, labels) {
    return {
        date: periodDate,
        ts: periodToDate(periodDate).getTime(),
        total: labels.length,
        completed: 0,
        items: labels.map((label) => ({ label, done: false })),
        empty: true,
    };
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

// Public: history records, newest period first. Every day from the first
// recorded one through the current period is present; days that were never
// written to the log appear as zero-completion entries rather than being
// skipped, so the streak of "nothing done" days stays visible.
export function getQuestHistory() {
    const history = loadHistory();
    const stored = Object.values(history).sort((a, b) => a.ts - b.ts);
    if (!stored.length) return [];

    const records = [];
    const cursor = periodToDate(stored[0].date);
    const endTs = periodToDate(getCurrentPeriodDate()).getTime();
    let labels = stored[0].items.map((it) => it.label);

    while (cursor.getTime() <= endTs) {
        const key = dateToPeriod(cursor);
        const rec = history[key];
        if (rec) {
            labels = rec.items.map((it) => it.label);
            records.push(rec);
        } else {
            records.push(emptyRecord(key, labels));
        }
        cursor.setDate(cursor.getDate() + 1);
    }
    return records.reverse();
}

// Public: toggle the done state of a single item within a stored history day.
// The current period is routed through the live quest state so progress and
// streaks stay in sync; past periods are edited directly in the history log.
export function toggleHistoryItemAt(periodDate, itemIndex) {
    const history = loadHistory();
    // Gap days are only synthesized for display; toggling one writes it to the
    // log for real so the change survives a reload.
    const rec = history[periodDate]
        || getQuestHistory().find((r) => r.date === periodDate);
    if (!rec || !rec.items[itemIndex]) return;
    history[periodDate] = rec;
    delete rec.empty;
    const item = rec.items[itemIndex];

    if (periodDate === getCurrentPeriodDate()) {
        const idx = quests.findIndex((q) => q.label === item.label);
        if (idx !== -1) { toggle(idx); return; }
    }

    item.done = !item.done;
    rec.completed = rec.items.filter((it) => it.done).length;
    try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch {}
    refreshExpandedHistory();
}

function shouldReset() {
    const lastReset = parseInt(localStorage.getItem(RESET_KEY) || "0", 10);
    return lastReset < getLastResetBoundary();
}

function loadQuests() {
    if (shouldReset()) {
        localStorage.removeItem(QUESTS_KEY);
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

const PRIVACY_KEY = "quests-privacy";

function loadPrivacy() {
    return localStorage.getItem(PRIVACY_KEY) === "1";
}

let privacyMode = loadPrivacy();

// Reflects privacyMode onto the DOM: a body-level class (so it reaches both
// the docked panel and the fullscreen overlay's quest lists) plus the
// toggle button's visual state wherever it's rendered.
function applyPrivacyMode() {
    document.body.classList.toggle("quests-private", privacyMode);
    document.querySelectorAll(".quests-privacy").forEach((btn) => {
        btn.classList.toggle("active", privacyMode);
        btn.title = privacyMode ? "Show quests" : "Hide quests";
        btn.setAttribute("aria-pressed", String(privacyMode));
    });
    document.querySelectorAll(".quests-maximize").forEach((btn) => {
        btn.classList.toggle("disabled", privacyMode);
        btn.title = privacyMode ? "Expand disabled while hidden" : "Expand (Q)";
    });
}

function togglePrivacy() {
    privacyMode = !privacyMode;
    localStorage.setItem(PRIVACY_KEY, privacyMode ? "1" : "0");
    applyPrivacyMode();
    renderQuests();
    if (privacyMode) closeExpanded();
}

const drag = createDraggable({
    getItems: () => quests,
    onReorder: (arr) => { quests = arr; saveQuests(quests); },
    render: () => renderQuests(),
});

function updateProgress() {
    const done = quests.filter((q) => q.done).length;
    const text = `${done}/${quests.length}`;
    document.querySelectorAll(".quests-progress").forEach((el) => { el.textContent = text; });
}

function toggle(index) {
    quests[index].done = !quests[index].done;
    saveQuests(quests);

    // Record the current period's progress live, so history (and streaks,
    // which are derived from it) reflect each toggle.
    recordHistory(getCurrentPeriodDate(), quests);

    renderQuests();
    refreshExpandedHistory();
}

// Streaks are derived from the history log rather than tracked incrementally,
// so any day with no completion — whether the app was opened or not — breaks
// the chain. Counts today (if done) plus the unbroken run of prior done days.
function getStreak(label) {
    const todayQuest = quests.find((q) => q.label === label);
    const history = loadHistory();

    let streak = todayQuest?.done ? 1 : 0;
    const cursor = periodToDate(getCurrentPeriodDate());
    cursor.setDate(cursor.getDate() - 1);

    while (true) {
        const rec = history[dateToPeriod(cursor)];
        const item = rec?.items.find((it) => it.label === label);
        if (!item?.done) break;
        streak++;
        cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
}

function renderQuests() {
    const lists = document.querySelectorAll(".quest-list");
    if (!lists.length) return;

    const tpl = html`${drag.displayItems().map((q, displayIdx) => {
        const actualIdx = quests.indexOf(q);
        const s = getStreak(q.label);
        return html`
            <div class="quest-item om-list-row ${q.done ? "done" : ""} ${drag.classFor(displayIdx)}"
                 draggable=${privacyMode ? "false" : "true"}
                 @dragstart=${(e) => { if (privacyMode) { e.preventDefault(); return; } drag.start(e, displayIdx); }}
                 @dragend=${(e) => drag.end(e)}
                 @dragover=${(e) => drag.over(e, displayIdx)}
                 @drop=${(e) => drag.drop(e, displayIdx)}
                 @click=${(e) => { if (drag.active) e.preventDefault(); }}>
                <button class="quest-check" role="checkbox" aria-checked=${q.done ? "true" : "false"}
                        aria-label=${q.label} tabindex=${privacyMode ? "-1" : "0"}
                        @click=${(e) => { e.stopPropagation(); toggle(actualIdx); }}>${Icon("check", { size: 13, stroke: 3.2 })}</button>
                <span class="quest-label">${q.url ? html`<a href=${q.url} target="_blank">${q.label}</a>` : q.label}</span>
                <span class="quest-streak ${s === 0 ? "none" : ""}" title=${`${s}-day streak`}>${Icon("flame", { size: 13, stroke: 2 })}${s}</span>
            </div>
        `;
    })}`;

    lists.forEach((list) => render(tpl, list));
    updateProgress();
}

// ── Fullscreen expanded view (tasks + history) ──────────────
let expanded = null;

function refreshExpandedHistory() {
    const body = expanded?.sheet.querySelector(".qx-history-body");
    if (body) renderHistory(body);
}

function onExpandedKey(e) {
    if (e.key === "Escape") { e.preventDefault(); closeExpanded(); }
}

function closeExpanded() {
    if (!expanded) return;
    expanded.close();
    expanded = null;
    renderQuests();
}

// The same button on the panel and on the sheet, in whichever furniture it sits on.
function PrivacyButton(cls) {
    return html`
        <button class="quests-privacy ${cls} om-icon" title="Hide quests" aria-pressed="false" @click=${togglePrivacy}>
            ${Icon("eye", { cls: "icon-on" })}${Icon("eyeOff", { cls: "icon-off" })}
        </button>
    `;
}

export function openQuestsExpanded() {
    if (expanded) { closeExpanded(); return; }
    if (privacyMode) return;

    expanded = openSheet({
        className: "qx-sheet",
        bodyClass: "qx-fullscreen-open",
        onKey: onExpandedKey,
        onDismiss: closeExpanded,
    });
    render(html`
        <div class="sheet-bar">
            <div class="sheet-titlegroup">
                <span class="sheet-title">Quests</span>
                <span class="sheet-sub quests-progress"></span>
            </div>
            <div class="sheet-actions">
                ${PrivacyButton("sheet-btn")}
                <button class="sheet-btn om-icon" title="Minimize (Esc)" aria-label="Minimize" @click=${closeExpanded}>
                    ${Icon("minimize", { size: 17, stroke: 2 })}
                </button>
            </div>
        </div>
        <div class="qx-body">
            <div class="qx-col">
                <div class="sheet-caption">Today</div>
                <div class="qx-col-body scroll-contain">
                    <div class="sheet-cell"><div class="quest-list om-wbs"></div></div>
                </div>
            </div>
            <div class="qx-col">
                <div class="sheet-caption">History</div>
                <div class="qx-col-body qx-history-body scroll-contain"></div>
            </div>
        </div>
    `, expanded.sheet);

    renderQuests();
    refreshExpandedHistory();
    applyPrivacyMode();
}

export function QuestsPanel() {
    injectStyles("quests", css);

    const done = quests.filter((q) => q.done).length;

    queueMicrotask(() => { renderQuests(); applyPrivacyMode(); });
    return Panel(
        {
            title: html`
                <span class="panel-heading">
                    <span>Quests</span>
                    <span class="panel-count quests-progress">${done}/${quests.length}</span>
                </span>
                <span class="panel-actions">
                    ${PrivacyButton("panel-btn")}
                    <button class="quests-maximize panel-btn om-icon" title="Expand (Q)" @click=${openQuestsExpanded}>
                        ${Icon("maximize", { size: 16 })}
                    </button>
                </span>
            `,
            className: "quests-panel",
        },
        html`<div class="quest-list om-wbs"></div>`,
    );
}
