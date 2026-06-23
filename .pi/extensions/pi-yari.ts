import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import * as fs from "node:fs";
import * as path from "node:path";

const DEFAULT_THRESHOLD = 3;
const DEFAULT_MESSAGES = [
  "Repetition warning: It seems like you might be stuck in a loop.",
  "Are you stuck? Maybe try a different approach.",
];

interface Config {
  threshold?: number;
  messages?: string[];
}

function loadConfig(ctx: ExtensionContext): Config {
  const config: Config = {};

  // Try project-local first
  const projectPath = path.join(ctx.cwd, ".pi", "extensions", "pi-yari.json");
  if (fs.existsSync(projectPath)) {
    Object.assign(config, JSON.parse(fs.readFileSync(projectPath, "utf-8")));
  } else {
    // Fall back to global
    const home = process.env.HOME || process.env.USERPROFILE;
    if (home) {
      const globalPath = path.join(home, ".pi", "agent", "extensions", "pi-yari.json");
      if (fs.existsSync(globalPath)) {
        Object.assign(config, JSON.parse(fs.readFileSync(globalPath, "utf-8")));
      }
    }
  }

  return config;
}

export default function (pi: ExtensionAPI) {
  let threshold = DEFAULT_THRESHOLD;
  let messages = [...DEFAULT_MESSAGES];

  // Repetition tracker: null means no active streak
  let tracker: { toolName: string; argsKey: string; count: number } | null = null;

  pi.on("session_start", async (_event, ctx) => {
    const config = loadConfig(ctx);
    if (typeof config.threshold === "number" && config.threshold > 0) {
      threshold = config.threshold;
    }
    if (Array.isArray(config.messages) && config.messages.length > 0) {
      messages = config.messages;
    }
  });

  pi.on("tool_execution_end", async (event, ctx) => {
    const input = event.input ?? {};
    const argsKey = JSON.stringify(
      Object.entries(input).sort(([a], [b]) => a.localeCompare(b))
    );

    if (tracker?.toolName === event.toolName && tracker?.argsKey === argsKey) {
      tracker.count++;

      if (tracker.count >= threshold) {
        const msg = messages[Math.floor(Math.random() * messages.length)];
        pi.sendMessage({
          customType: "pi-yari",
          content: msg,
          display: true,
        });
        tracker = null; // reset counter after warning
      }
    } else {
      tracker = { toolName: event.toolName, argsKey, count: 1 };
    }
  });
}
