import fs from "node:fs";
import path from "node:path";

const dist = path.resolve("dist");
const serverDir = path.join(dist, "server");
const openaiDir = path.join(dist, ".openai");
const indexHtml = fs.readFileSync(path.resolve("index.html"), "utf8");
const stylesCss = fs.readFileSync(path.resolve("styles.css"), "utf8");
const appBundle = fs.readFileSync(path.resolve("app.bundle.js"), "utf8");
const logoSvg = fs.readFileSync(path.resolve("assets", "apex-logo.svg"), "utf8");
const officialApexLogo = fs
  .readFileSync(path.resolve("assets", "apex-logo-official.jpg"))
  .toString("base64");
const earthHorizon = fs
  .readFileSync(path.resolve("assets", "earth-horizon-master.png"))
  .toString("base64");

fs.mkdirSync(serverDir, { recursive: true });
fs.mkdirSync(openaiDir, { recursive: true });
fs.cpSync(path.resolve("server", "market-data"), path.join(serverDir, "market-data"), { recursive: true });
fs.cpSync(path.resolve("server", "scanner"), path.join(serverDir, "scanner"), { recursive: true });
fs.cpSync(path.resolve("server", "macro"), path.join(serverDir, "macro"), { recursive: true });
fs.cpSync(path.resolve("server", "news"), path.join(serverDir, "news"), { recursive: true });
fs.cpSync(path.resolve("server", "jarvis"), path.join(serverDir, "jarvis"), { recursive: true });
fs.cpSync(path.resolve("server", "vision"), path.join(serverDir, "vision"), { recursive: true });
fs.writeFileSync(path.join(serverDir, "package.json"), JSON.stringify({ type: "module" }, null, 2));

fs.copyFileSync(path.resolve(".openai", "hosting.json"), path.join(openaiDir, "hosting.json"));

fs.writeFileSync(
  path.join(serverDir, "index.js"),
  `import { handleMarketApiRequest } from "./market-data/router.js";
import { handleScannerApiRequest } from "./scanner/router.js";
import { handleMacroApiRequest } from "./macro/router.js";
import { handleNewsApiRequest } from "./news/router.js";
import { handleJarvisApiRequest } from "./jarvis/router.js";
import { handleVisionApiRequest } from "./vision/router.js";

const files = {
  "/": { body: ${JSON.stringify(indexHtml)}, type: "text/html; charset=utf-8" },
  "/index.html": { body: ${JSON.stringify(indexHtml)}, type: "text/html; charset=utf-8" },
  "/styles.css": { body: ${JSON.stringify(stylesCss)}, type: "text/css; charset=utf-8" },
  "/app.bundle.js": { body: ${JSON.stringify(appBundle)}, type: "application/javascript; charset=utf-8" },
  "/assets/apex-logo.svg": { body: ${JSON.stringify(logoSvg)}, type: "image/svg+xml; charset=utf-8" },
  "/assets/apex-logo-official.jpg": { body: ${JSON.stringify(officialApexLogo)}, type: "image/jpeg", encoding: "base64" },
  "/assets/earth-horizon-master.png": { body: ${JSON.stringify(earthHorizon)}, type: "image/png", encoding: "base64" },
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const marketResponse = await handleMarketApiRequest(request, env);
    if (marketResponse) return marketResponse;
    const scannerResponse = await handleScannerApiRequest(request, env);
    if (scannerResponse) return scannerResponse;
    const macroResponse = await handleMacroApiRequest(request, env);
    if (macroResponse) return macroResponse;
    const newsResponse = await handleNewsApiRequest(request, env);
    if (newsResponse) return newsResponse;
    const jarvisResponse = await handleJarvisApiRequest(request, env);
    if (jarvisResponse) return jarvisResponse;
    const visionResponse = await handleVisionApiRequest(request, env);
    if (visionResponse) return visionResponse;
    const file = files[url.pathname];

    if (!file) {
      if (url.pathname.startsWith("/assets/")) {
        return new Response("Not found", { status: 404 });
      }

      return new Response(files["/"].body, {
        status: 200,
        headers: {
          "content-type": files["/"].type,
          "cache-control": "no-cache"
        }
      });
    }

    const body = file.encoding === "base64"
      ? Uint8Array.from(atob(file.body), (character) => character.charCodeAt(0))
      : file.body;

    return new Response(body, {
      status: 200,
      headers: {
        "content-type": file.type,
        "cache-control": "public, max-age=60"
      }
    });
  }
};
`,
);
