import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";

const production = process.argv.includes("--production");
const children = [];
let stopping = false;

function start(command, args, options = {}) {
  const child = spawn(command, args, {
    stdio: "inherit",
    env: process.env,
    ...options,
  });
  children.push(child);
  child.on("exit", (code, signal) => {
    if (stopping) return;
    if (code && code !== 0) {
      console.error(`${command} stopped with exit code ${code}`);
    } else if (signal) {
      console.error(`${command} stopped after signal ${signal}`);
    }
    shutdown(code ?? 1);
  });
  return child;
}

function shutdown(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (!child.killed) child.kill("SIGTERM");
  }
  setTimeout(() => process.exit(exitCode), 250);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

start("go", ["run", "./cmd/server"], {
  cwd: new URL("../apps/api", import.meta.url),
  env: {
    ...process.env,
    GOCACHE: process.env.GOCACHE || join(tmpdir(), "eventwallah-go-cache"),
  },
});
start("npm", ["run", production ? "start:web" : "dev:web"]);
