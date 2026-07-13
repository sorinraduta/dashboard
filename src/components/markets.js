import { html, render } from "../vendor/lit-html.js";
import { injectStyles } from "./styles.js";
import { Panel } from "./panel.js";
import { createDraggable } from "./draggable.js";
import { getConfig } from "../config-store.js";
import { corsFetch } from "../cors-fetch.js";
const config = getConfig();

const css = `
.markets-panel {
    grid-column: 1;
    grid-row: 4 / 6;
}

.markets-list {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 3px;
    overflow-y: auto;
}

.market-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 0.64rem;
    padding: 3px 0;
    border-bottom: 1px solid var(--border);
    text-decoration: none;
    color: inherit;
    transition: all 0.15s;
    cursor: grab;
}

.market-item:last-child {
    border-bottom: none;
}

.market-item:hover .market-symbol {
    color: var(--accent);
}

.market-symbol {
    color: var(--text);
    font-weight: normal;
    min-width: 55px;
    transition: color 0.2s;
}

.market-price {
    color: var(--text);
    text-align: right;
}

.market-change {
    text-align: right;
    min-width: 58px;
    font-size: 0.58rem;
}

.market-change.up {
    color: var(--accent);
}

.market-change.down {
    color: var(--accent2);
}

.market-change.flat {
    color: var(--dim);
}

.markets-loading {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--dim);
    font-size: 0.68rem;
}
`;

const DEFAULT_TICKERS = config.markets;

const STORAGE_KEY = "markets-order";

function loadOrder() {
    try {
        // Support old key from before rename
        const saved =
            JSON.parse(localStorage.getItem(STORAGE_KEY)) ||
            JSON.parse(localStorage.getItem("stocks-order"));
        if (Array.isArray(saved) && saved.length) return saved;
    } catch {}
    return null;
}

function getOrderedTickers() {
    const savedOrder = loadOrder();
    if (!savedOrder) return [...DEFAULT_TICKERS];
    const map = new Map(DEFAULT_TICKERS.map((t) => [t.label, t]));
    const ordered = [];
    for (const label of savedOrder) {
        if (map.has(label)) { ordered.push(map.get(label)); map.delete(label); }
    }
    for (const t of map.values()) ordered.push(t);
    return ordered;
}

let tickers = getOrderedTickers();

const drag = createDraggable({
    getItems: () => tickers,
    onReorder: (arr) => {
        tickers = arr;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(arr.map((t) => t.label)));
    },
    render: () => renderMarkets(),
});

function formatPrice(price, label) {
    if (price == null) return "—";
    if (label === "BTC") return price.toLocaleString("en-US", { maximumFractionDigits: 0 });
    if (label === "EUR/RON") return price.toFixed(4);
    return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function changeClass(change) {
    if (change > 0) return "up";
    if (change < 0) return "down";
    return "flat";
}

function formatChange(changePct) {
    if (changePct == null) return "";
    const sign = changePct >= 0 ? "+" : "";
    return `${sign}${changePct.toFixed(2)}%`;
}

const quotes = {};

async function fetchCrypto() {
    try {
        const res = await fetch(
            "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true",
        );
        const data = await res.json();
        if (data.bitcoin) {
            quotes["BTC"] = { price: data.bitcoin.usd, changePct: data.bitcoin.usd_24h_change || 0 };
        }
    } catch {}
}

async function fetchForex() {
    try {
        const [latestRes, prevRes] = await Promise.all([
            fetch("https://api.frankfurter.dev/v1/latest?from=EUR&to=RON"),
            fetch(`https://api.frankfurter.dev/v1/${getPreviousBusinessDay()}?from=EUR&to=RON`),
        ]);
        const latest = await latestRes.json();
        const prev = await prevRes.json();
        if (latest.rates?.RON) {
            const current = latest.rates.RON;
            const previous = prev.rates?.RON;
            const changePct = previous ? ((current - previous) / previous) * 100 : null;
            quotes["EUR/RON"] = { price: current, changePct };
        }
    } catch {}
}

function getPreviousBusinessDay() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
}

function yahooChartUrl(ticker) {
    const u = new URL("https://query1.finance.yahoo.com/v8/finance/chart/x");
    u.pathname = `/v8/finance/chart/${ticker}`;
    u.searchParams.set("range", "1d");
    u.searchParams.set("interval", "1d");
    return u.href;
}

async function fetchYahoo() {
    const yahooTickers = DEFAULT_TICKERS.filter((t) => t.ticker);
    await Promise.allSettled(
        yahooTickers.map(async (t) => {
            try {
                const res = await corsFetch(yahooChartUrl(t.ticker));
                if (!res.ok) return;
                const data = await res.json();
                const meta = data.chart?.result?.[0]?.meta;
                if (!meta) return;
                const price = meta.regularMarketPrice;
                const prevClose = meta.chartPreviousClose || meta.previousClose;
                const changePct = prevClose ? ((price - prevClose) / prevClose) * 100 : 0;
                quotes[t.label] = { price, changePct };
            } catch {}
        }),
    );
}

function renderMarkets() {
    const list = document.getElementById("markets-list");
    const loading = document.getElementById("markets-loading");
    if (!list) return;
    if (loading) loading.style.display = "none";

    render(
        html`${drag.displayItems().map((t, displayIdx) => {
            const q = quotes[t.label];
            const price = q ? formatPrice(q.price, t.label) : "—";
            const change = q ? formatChange(q.changePct) : "";
            const cls = q ? changeClass(q.changePct) : "flat";
            return html`
                <a
                    href=${t.url}
                    target="_blank"
                    class="market-item ${drag.classFor(displayIdx)}"
                    draggable="true"
                    @dragstart=${(e) => drag.start(e, displayIdx)}
                    @dragend=${(e) => drag.end(e)}
                    @dragover=${(e) => drag.over(e, displayIdx)}
                    @drop=${(e) => drag.drop(e, displayIdx)}
                    @click=${(e) => { if (drag.active) e.preventDefault(); }}
                >
                    <span class="market-symbol">${t.label}</span>
                    <span class="market-price">${price}</span>
                    <span class="market-change ${cls}">${change}</span>
                </a>
            `;
        })}`,
        list,
    );
}

async function fetchAll() {
    await Promise.allSettled([fetchCrypto(), fetchForex(), fetchYahoo()]);
    renderMarkets();
}

export function MarketsPanel() {
    injectStyles("markets", css);
    queueMicrotask(async () => {
        await fetchAll();
        setInterval(fetchAll, 60000);
    });
    return Panel(
        { title: "// MARKETS", className: "markets-panel" },
        html`
            <div class="markets-loading" id="markets-loading">// loading...</div>
            <div class="markets-list" id="markets-list"></div>
        `,
    );
}
