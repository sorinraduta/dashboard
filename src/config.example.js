export default {
    github: { user: "your-handle", weeks: 20 },

    links: [
        { href: "https://github.com", label: "GITHUB", color: "#f0f6fc" },
        { href: "https://example.com", label: "EXAMPLE", color: "#4ade80" },
    ],

    quests: {
        resetHour: 3,
        resetMinute: 0,
        items: [
            { label: "Ship one meaningful commit", url: "https://github.com" },
            { label: "30 min deep work (no notifications)" },
            { label: "Read one technical article" },
            { label: "Move body — walk or workout" },
        ],
    },

    markets: [
        { label: "NVDA", ticker: "NVDA", url: "https://finance.yahoo.com/quote/NVDA" },
        { label: "BTC", ticker: null, url: "https://www.coingecko.com/en/coins/bitcoin" },
        { label: "EUR/RON", ticker: null, url: "https://www.google.com/finance/quote/EUR-RON" },
    ],

    monitor: {
        websites: [
            {
                name: "example.com",
                url: "https://example.com",
                check: "https://example.com",
                icon: "web",
            },
        ],
        local: [],
    },
};
