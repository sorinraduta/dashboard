const PROXY_HOSTS = new Set(["query1.finance.yahoo.com", "query2.finance.yahoo.com"]);

/** Must match `scripts/dev-server.mjs` — run `npm run dev` when using Live Preview. */
export const DEV_PROXY_PORT = 8787;

function hostOf(url) {
    try {
        return new URL(url).hostname;
    } catch {
        return "";
    }
}

function isExtension() {
    return typeof chrome !== "undefined" && !!chrome.runtime?.id;
}

function isLocalWebPage() {
    const { protocol, hostname } = location;
    if (protocol === "chrome-extension:") return false;
    if (protocol !== "http:" && protocol !== "https:") return false;
    return hostname === "localhost" || hostname === "127.0.0.1";
}

function shouldProxy(url) {
    try {
        if (!isLocalWebPage()) return false;
        if (isExtension()) return false;
        return PROXY_HOSTS.has(hostOf(url));
    } catch {
        return false;
    }
}

function devProxyOrigin() {
    return `${location.protocol}//${location.hostname}:${DEV_PROXY_PORT}`;
}

// Route the request through the extension's background service worker. Requests
// made there are attributed to the extension, which sidesteps content/ad blockers
// that filter finance hosts in the page context (net::ERR_BLOCKED_BY_CLIENT).
function backgroundFetch(url) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ type: "cors-fetch", url }, (resp) => {
            if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
            if (!resp) return reject(new Error("No response from background worker"));
            if (resp.error) return reject(new Error(resp.error));
            resolve(new Response(resp.body, { status: resp.status || 200 }));
        });
    });
}

/** Use dev-server proxy on localhost; background worker in the extension; plain fetch otherwise. */
export function corsFetch(input, init) {
    const url = typeof input === "string" ? input : input.url;

    if (shouldProxy(url)) {
        const proxy = new URL("/__proxy", devProxyOrigin());
        proxy.searchParams.set("url", url);
        return fetch(proxy, init);
    }

    if (isExtension() && PROXY_HOSTS.has(hostOf(url))) {
        return backgroundFetch(url);
    }

    return fetch(input, init);
}
