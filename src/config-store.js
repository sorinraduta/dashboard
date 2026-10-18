const KEY = "dashboard-config";

const SAFE_DEFAULTS = {
    github:  { user: "", weeks: 20 },
    links:   [],
    quests:  { resetHour: 3, resetMinute: 0, items: [] },
    markets: [],
    monitor: { websites: [], local: [] },
};

function merge(cfg) {
    const c = cfg && typeof cfg === "object" ? cfg : {};
    return {
        github: { ...SAFE_DEFAULTS.github,  ...c.github },
        links:  Array.isArray(c.links)  ? c.links  : SAFE_DEFAULTS.links,
        quests: {
            ...SAFE_DEFAULTS.quests,
            ...c.quests,
            items: Array.isArray(c.quests?.items) ? c.quests.items : SAFE_DEFAULTS.quests.items,
        },
        markets: Array.isArray(c.markets) ? c.markets : SAFE_DEFAULTS.markets,
        monitor: {
            websites: Array.isArray(c.monitor?.websites) ? c.monitor.websites : SAFE_DEFAULTS.monitor.websites,
            local:    Array.isArray(c.monitor?.local)    ? c.monitor.local    : SAFE_DEFAULTS.monitor.local,
        },
    };
}

// Try to load config.js as the seed for first-run; silently skip if absent (e.g. Vercel).
let fileConfig = SAFE_DEFAULTS;
try {
    const mod = await import("./config.js");
    fileConfig = merge(mod.default);
} catch {}

// Additions to a config that is already saved. Once the editor has written a
// config to localStorage, a later change to config.js never reaches it, so an
// entry the dashboard should start showing is seeded here instead — once: each
// seed is recorded as it lands, so deleting the entry in the editor is final.
// Seeds go into the stored JSON as-is, so keys `merge` does not know survive.
const SEEDS_KEY = "dashboard-config-seeds";

const SEEDS = [
    {
        id: "monitor-horah",
        apply(cfg) {
            const horah = { name: "horah.app", url: "https://horah.app", check: "https://horah.app", icon: "horah" };
            cfg.monitor = cfg.monitor && typeof cfg.monitor === "object" ? cfg.monitor : {};
            if (!Array.isArray(cfg.monitor.websites)) cfg.monitor.websites = [];
            const host = (u) => { try { return new URL(u).hostname; } catch { return null; } };
            if (cfg.monitor.websites.some((w) => host(w?.url) === host(horah.url))) return false;
            cfg.monitor.websites.push(horah);
            return true;
        },
    },
];

function applySeeds(stored) {
    let applied;
    try { applied = new Set(JSON.parse(localStorage.getItem(SEEDS_KEY)) || []); } catch { applied = new Set(); }
    const pending = SEEDS.filter((seed) => !applied.has(seed.id));
    if (!pending.length) return stored;

    let changed = false;
    for (const seed of pending) {
        changed = seed.apply(stored) || changed;
        applied.add(seed.id);
    }
    if (changed) setConfig(stored);
    localStorage.setItem(SEEDS_KEY, JSON.stringify([...applied]));
    return stored;
}

export function getConfig() {
    try {
        const s = localStorage.getItem(KEY);
        if (s) {
            const stored = JSON.parse(s);
            if (stored && typeof stored === "object") return merge(applySeeds(stored));
        }
    } catch {}
    return fileConfig;
}

export function setConfig(cfg) {
    localStorage.setItem(KEY, JSON.stringify(cfg));
}
