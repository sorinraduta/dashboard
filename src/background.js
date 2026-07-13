// Fetches on behalf of the new-tab page. Requests made here are attributed to
// the extension itself, so they sidestep content/ad blockers (e.g. uBlock) that
// filter finance hosts like query1.finance.yahoo.com in the page context.
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type !== "cors-fetch" || typeof msg.url !== "string") return;

    fetch(msg.url)
        .then(async (r) => sendResponse({ ok: r.ok, status: r.status, body: await r.text() }))
        .catch((e) => sendResponse({ ok: false, status: 0, error: String(e) }));

    return true; // keep the message channel open for the async response
});
