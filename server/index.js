import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Readable } from "node:stream";
import { createPlatformApplication } from "./platform/app.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const files = new Map([
  ["/", ["index.html", "text/html; charset=utf-8"]],
  ["/index.html", ["index.html", "text/html; charset=utf-8"]],
  ["/styles.css", ["styles.css", "text/css; charset=utf-8"]],
  ["/app.bundle.js", ["app.bundle.js", "application/javascript; charset=utf-8"]],
  ["/assets/apex-logo.svg", ["assets/apex-logo.svg", "image/svg+xml"]],
  ["/assets/apex-logo-official.jpg", ["assets/apex-logo-official.jpg", "image/jpeg"]],
  ["/assets/earth-horizon-master.png", ["assets/earth-horizon-master.png", "image/png"]],
]);

async function staticHandler(request) {
  const pathname = new URL(request.url).pathname;
  if (request.method !== "GET" && request.method !== "HEAD") return null;
  const definition = files.get(pathname) || (!pathname.startsWith("/api/") && !pathname.startsWith("/assets/") ? files.get("/") : null);
  if (!definition) return null;
  const body = await readFile(path.join(root, definition[0]));
  return new Response(request.method === "HEAD" ? null : body, { status: 200, headers: { "content-type": definition[1], "cache-control": pathname === "/" || pathname === "/index.html" ? "no-cache" : "public, max-age=60" } });
}

const app = createPlatformApplication({ env: process.env, staticHandler });
const server = createServer(async (incoming, outgoing) => {
  try {
    const origin = `http://${incoming.headers.host || `127.0.0.1:${app.config.port}`}`;
    const url = new URL(incoming.url || "/", origin);
    const hasBody = !["GET", "HEAD"].includes(incoming.method || "GET");
    const request = new Request(url, { method: incoming.method, headers: incoming.headers, body: hasBody ? Readable.toWeb(incoming) : undefined, duplex: hasBody ? "half" : undefined });
    const response = await app.handle(request);
    outgoing.writeHead(response.status, Object.fromEntries(response.headers));
    if (response.body) Readable.fromWeb(response.body).pipe(outgoing); else outgoing.end();
  } catch {
    outgoing.writeHead(500, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
    outgoing.end(JSON.stringify({ success: false, error: { code: "INTERNAL_ERROR", message: "JARVIS could not complete this request." } }));
  }
});

server.listen(app.config.port, app.config.host, () => {
  console.info(JSON.stringify({ level: "info", event: "server_started", host: app.config.host, port: app.config.port, buildVersion: app.config.buildVersion, environmentValid: app.validation.valid }));
});

for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => server.close(() => process.exit(0)));
