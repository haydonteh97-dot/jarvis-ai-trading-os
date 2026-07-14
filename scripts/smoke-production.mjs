import { spawn } from "node:child_process";
import { once } from "node:events";

const port = 43174;
const child = spawn(process.execPath, ["server/index.js"], {
  cwd: new URL("..", import.meta.url),
  env: { ...process.env, HOST: "127.0.0.1", PORT: String(port), BETA_MODE: "false", MARKET_DATA_MODE: "mock", MACRO_DATA_MODE: "mock", NEWS_DATA_MODE: "mock", AI_MODE: "mock", VISION_MODE: "mock", BUILD_VERSION: "smoke-test" },
  stdio: ["ignore", "pipe", "pipe"],
});

let output = "";
child.stdout.on("data", (chunk) => { output += chunk; });
child.stderr.on("data", (chunk) => { output += chunk; });

try {
  const deadline = Date.now() + 10_000;
  while (!output.includes("server_started") && Date.now() < deadline) await new Promise((resolve) => setTimeout(resolve, 50));
  if (!output.includes("server_started")) throw new Error("Production server did not start.");
  for (const path of ["/health", "/api/status", "/"]) {
    const response = await fetch(`http://127.0.0.1:${port}${path}`);
    if (!response.ok) throw new Error(`Smoke request failed for ${path}: ${response.status}`);
  }
  console.info("Production smoke test passed.");
} finally {
  child.kill("SIGTERM");
  await Promise.race([once(child, "exit"), new Promise((resolve) => setTimeout(resolve, 2000))]);
}
