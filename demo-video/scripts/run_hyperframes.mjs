#!/usr/bin/env node
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

// This WSL installation keeps Chrome's NSS libraries in the user's workspace.
// Preserve any existing library search paths and leave other hosts as configured.
const env = { ...process.env };
const libraries = join(homedir(), "chrome-libs/usr/lib/x86_64-linux-gnu");
if (process.platform === "linux" && existsSync(join(libraries, "libnss3.so"))) {
  env.LD_LIBRARY_PATH = [libraries, env.LD_LIBRARY_PATH].filter(Boolean).join(":");
}
const [command, ...args] = process.argv.slice(2);
if (!command) throw new Error("A HyperFrames command is required.");
// Checks are one-shot here; a warm idle browser would compete with local TTS.
if (args.includes("check")) env.CI = "1";
const child = spawn(command, args, { env, stdio: "inherit" });
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}
child.on("error", (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
child.on("exit", (code, signal) => {
  process.exitCode = code ?? (signal ? 1 : 0);
});
