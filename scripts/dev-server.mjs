import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "../src");
const PORT = Number(process.env.PORT) || 8787;

const ALLOWED_PROXY_HOSTS = new Set([
    "query1.finance.yahoo.com",
    "query2.finance.yahoo.com",
]);

const MIME = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
};

const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "*",
};

function send(res, status, headers, body) {
    res.writeHead(status, { ...CORS, ...headers });
    res.end(body);
}

async function handleProxy(targetUrl, res) {
    let parsed;
    try {
        parsed = new URL(targetUrl);
    } catch {
        send(res, 400, { "Content-Type": "text/plain" }, "Bad url");
        return;
    }
    if (!ALLOWED_PROXY_HOSTS.has(parsed.hostname)) {
        send(res, 403, { "Content-Type": "text/plain" }, "Forbidden");
        return;
    }
    try {
        const upstream = await fetch(parsed.toString());
        const body = Buffer.from(await upstream.arrayBuffer());
        send(res, upstream.status, {
            "Content-Type": upstream.headers.get("content-type") || "application/octet-stream",
        }, body);
    } catch {
        send(res, 502, { "Content-Type": "text/plain" }, "Upstream error");
    }
}

function serveStatic(pathname, res) {
    const safe = pathname === "/" ? "/index.html" : pathname;
    const filePath = path.join(ROOT, path.normalize(safe).replace(/^(\.\.(\/|\\|$))+/, ""));
    if (!filePath.startsWith(ROOT)) {
        send(res, 403, { "Content-Type": "text/plain" }, "Forbidden");
        return;
    }
    fs.readFile(filePath, (err, data) => {
        if (err) {
            send(res, 404, { "Content-Type": "text/plain" }, "Not found");
            return;
        }
        const ext = path.extname(filePath);
        send(res, 200, { "Content-Type": MIME[ext] || "application/octet-stream" }, data);
    });
}

http
    .createServer(async (req, res) => {
        try {
            if (req.method === "OPTIONS") {
                send(res, 204, {}, "");
                return;
            }
            const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
            if (url.pathname === "/__proxy") {
                await handleProxy(url.searchParams.get("url"), res);
                return;
            }
            serveStatic(url.pathname, res);
        } catch {
            send(res, 500, { "Content-Type": "text/plain" }, "Server error");
        }
    })
    .listen(PORT, () => {
        console.log(`Dashboard dev server: http://localhost:${PORT}`);
        console.log(`Yahoo CORS proxy: http://localhost:${PORT}/__proxy`);
    });
