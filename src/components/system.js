import { html } from "../vendor/lit-html.js";
import { injectStyles } from "./styles.js";
import { Panel } from "./panel.js";

const css = `
.sys-panel {
    grid-column: 1;
    grid-row: 3;
}

.sys-row {
    margin-bottom: 10px;
}

.sys-label-row {
    display: flex;
    justify-content: space-between;
    font-size: 0.7rem;
    margin-bottom: 4px;
}

.lbl {
    color: var(--dim);
}

.val {
    color: var(--text);
}
.val.good {
    color: var(--accent);
}
.val.warn {
    color: var(--accent3);
}
.val.crit {
    color: var(--accent2);
}

.bar {
    height: 4px;
    background: var(--border);
    border-radius: 3px;
    overflow: hidden;
}

.bar-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.6s ease;
}

.bar-fill.cpu {
    background: var(--accent);
}
.bar-fill.mem {
    background: var(--accent2);
}
.bar-sub {
    font-size: 0.6rem;
    color: var(--dim);
    margin-top: 3px;
}

.sys-sep {
    border: none;
    border-top: 1px solid var(--border);
    margin: 6px 0 8px;
}

.info-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    font-size: 0.66rem;
    margin-bottom: 5px;
    gap: 6px;
}

.info-lbl {
    color: var(--dim);
    flex-shrink: 0;
}
.info-val {
    color: var(--text);
    text-align: right;
    word-break: break-all;
}
`;

function formatBytes(bytes) {
    const gb = bytes / (1024 * 1024 * 1024);
    return gb >= 1 ? `${gb.toFixed(1)} GB` : `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
}

function pctClass(pct) {
    if (pct < 60) return "good";
    if (pct < 85) return "warn";
    return "crit";
}

function updateBar(id, pctId, value) {
    const bar = document.getElementById(id);
    const label = document.getElementById(pctId);
    if (bar) bar.style.width = `${value}%`;
    if (label) {
        label.textContent = `${value}%`;
        label.className = `val ${pctClass(value)}`;
    }
}

function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

const sessionStart = Date.now();

function updateSessionUptime() {
    const diff = Math.floor((Date.now() - sessionStart) / 1000);
    const h = String(Math.floor(diff / 3600)).padStart(2, "0");
    const m = String(Math.floor((diff % 3600) / 60)).padStart(2, "0");
    const s = String(diff % 60).padStart(2, "0");
    setText("session-uptime", `${h}:${m}:${s}`);
}

function updateMemory() {
    if (performance.memory) {
        const used = performance.memory.usedJSHeapSize;
        const total = performance.memory.jsHeapSizeLimit;
        const pct = Math.round((used / total) * 100);
        updateBar("mem-bar", "mem-pct", pct);
        setText("mem-sub", `${formatBytes(used)} / ${formatBytes(total)}`);
    }
}

let lastCpuPct = 0;
function updateCpu() {
    const start = performance.now();
    requestAnimationFrame(() => {
        const frameDuration = performance.now() - start;
        const load = Math.min(100, Math.round(((frameDuration - 4) / 50) * 100));
        lastCpuPct = Math.max(0, Math.min(100, Math.round(lastCpuPct * 0.6 + load * 0.4)));
        updateBar("cpu-bar", "cpu-pct", lastCpuPct);
    });
}

async function fetchSystemInfo() {
    setText("cpu-cores", navigator.hardwareConcurrency || "—");
    setText("platform-val", navigator.userAgentData?.platform || navigator.platform || "—");

    if (navigator.userAgentData?.getHighEntropyValues) {
        try {
            const ua = await navigator.userAgentData.getHighEntropyValues(["architecture"]);
            if (ua.architecture) {
                setText("cpu-arch", ua.architecture);
            } else {
                document.getElementById("arch-row")?.remove();
            }
        } catch {
            document.getElementById("arch-row")?.remove();
        }
    } else {
        document.getElementById("arch-row")?.remove();
    }

    updateMemory();
    updateCpu();

    setInterval(updateMemory, 5000);
    setInterval(updateCpu, 3000);
    setInterval(updateSessionUptime, 1000);
}

export function SystemPanel() {
    injectStyles("system", css);
    queueMicrotask(fetchSystemInfo);

    const cores = navigator.hardwareConcurrency || "—";
    const platform = navigator.userAgentData?.platform || navigator.platform || "—";

    return Panel(
        { title: "// SYSTEM", className: "sys-panel" },
        html`
            <div class="sys-row">
                <div class="sys-label-row">
                    <span class="lbl">CPU</span>
                    <span class="val good" id="cpu-pct">0%</span>
                </div>
                <div class="bar">
                    <div class="bar-fill cpu" id="cpu-bar" style="width: 0%"></div>
                </div>
            </div>

            <div class="sys-row">
                <div class="sys-label-row">
                    <span class="lbl">MEMORY</span>
                    <span class="val good" id="mem-pct">0%</span>
                </div>
                <div class="bar">
                    <div class="bar-fill mem" id="mem-bar" style="width: 0%"></div>
                </div>
                <div class="bar-sub" id="mem-sub"></div>
            </div>

            <div class="info-row">
                <span class="info-lbl">PLATFORM</span>
                <span class="info-val" id="platform-val">${platform}</span>
            </div>
            <div class="info-row" id="arch-row">
                <span class="info-lbl">ARCH</span>
                <span class="info-val" id="cpu-arch">—</span>
            </div>
            <div class="info-row">
                <span class="info-lbl">CORES</span>
                <span class="info-val" id="cpu-cores">${cores}</span>
            </div>
            <div class="info-row">
                <span class="info-lbl">SESSION</span>
                <span class="info-val" id="session-uptime">00:00:00</span>
            </div>
        `,
    );
}
