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

export function getConfig() {
    try {
        const s = localStorage.getItem(KEY);
        if (s) return merge(JSON.parse(s));
    } catch {}
    return fileConfig;
}

export function setConfig(cfg) {
    localStorage.setItem(KEY, JSON.stringify(cfg));
}
