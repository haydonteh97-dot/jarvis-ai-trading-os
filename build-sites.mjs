import fs from "node:fs";
import path from "node:path";

const dist = path.resolve("dist");
const serverDir = path.join(dist, "server");
const openaiDir = path.join(dist, ".openai");

fs.mkdirSync(serverDir, { recursive: true });
fs.mkdirSync(openaiDir, { recursive: true });

fs.copyFileSync(path.resolve(".openai", "hosting.json"), path.join(openaiDir, "hosting.json"));

fs.writeFileSync(
  path.join(serverDir, "index.js"),
  `export default {
  async fetch(request, env) {
    if (env && env.ASSETS && typeof env.ASSETS.fetch === "function") {
      return env.ASSETS.fetch(request);
    }

    return new Response("JARVIS site assets are not available in this runtime.", {
      status: 503,
      headers: { "content-type": "text/plain; charset=utf-8" }
    });
  }
};
`,
);
