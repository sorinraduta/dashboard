import { html, render } from "./vendor/lit-html.js";
import { injectStyles } from "./components/styles.js";
import { QuestsPanel, openQuestsExpanded } from "./components/quests.js";
import { CalendarPanel, openCalendarExpanded } from "./components/calendar.js";
import { NewsPanel, openHackerNews } from "./components/news.js";
import { LinksPanel } from "./components/links.js";
import { MonitorPanel } from "./components/monitor.js";
import { WisdomPanel } from "./components/wisdom.js";
import { MarketsPanel } from "./components/markets.js";
import { GithubPanel, openGithubProfile } from "./components/github.js";
import { openConfigEditor, handleEditorKeys } from "./components/config-editor.js";

const css = `
.dashboard {
    display: grid;
    grid-template-columns: 300px 1fr 280px;
    grid-template-rows: repeat(5, 1fr);
    gap: 8px;
    flex: 1;
    min-height: 0;
}
`;

// Single-letter shortcuts — no modifier key needed.
const COMMANDS = [
    { key: "c", action: openConfigEditor },
    { key: "q", action: openQuestsExpanded },
    { key: "l", action: openCalendarExpanded },
    { key: "n", action: openHackerNews },
    { key: "g", action: openGithubProfile },
];

function isEditableTarget(el) {
    if (!el) return false;
    return el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable;
}

function initCmdEffect() {
    document.addEventListener("keydown", (e) => {
        if (handleEditorKeys(e)) return;
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        if (isEditableTarget(document.activeElement)) return;

        const cmd = COMMANDS.find((c) => c.key === e.key.toLowerCase());
        if (cmd) { e.preventDefault(); cmd.action(); }
    });
}

function Dashboard() {
    injectStyles("dashboard", css);
    return html`
        <div class="dashboard">
            ${QuestsPanel()}
            ${GithubPanel()}
            ${MarketsPanel()}
            ${CalendarPanel()}
            ${MonitorPanel()}
            ${NewsPanel()}
            ${WisdomPanel()}
            ${LinksPanel()}
        </div>
    `;
}

render(Dashboard(), document.body);
initCmdEffect();
