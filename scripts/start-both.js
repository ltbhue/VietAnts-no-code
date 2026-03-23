/* eslint-disable no-console */
const { spawn } = require("node:child_process");

function run(cmd, args, name, env) {
  const child = spawn(cmd, args, {
    env: { ...process.env, ...(env ?? {}) },
    stdio: "inherit",
    shell: false,
  });

  child.on("exit", (code) => {
    console.error(`[${name}] exited with code ${code}`);
    // If one process dies, stop the other so container doesn't hang forever.
    process.exit(code ?? 1);
  });

  return child;
}

async function main() {
  console.log("Starting API + Web in a single Render service...");
  console.log("API_PORT:", process.env.API_PORT ?? "4000");
  console.log("WEB_PORT (Render PORT):", process.env.PORT ?? "3000");

  const api = run(
    process.platform === "win32" ? "npm.cmd" : "npm",
    ["run", "start", "--workspace", "api"],
    "api",
    { API_PORT: process.env.API_PORT ?? "4000" },
  );

  const web = run(
    process.platform === "win32" ? "npm.cmd" : "npm",
    ["run", "start", "--workspace", "web"],
    "web",
    {},
  );

  // Graceful shutdown
  const shutdown = () => {
    console.log("Shutting down...");
    try {
      api.kill("SIGTERM");
      web.kill("SIGTERM");
    } catch {
      // ignore
    }
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

