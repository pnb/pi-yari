import { CONFIG_DIR_NAME, type ExtensionAPI, type ExtensionContext } from "@earendil-works/pi-coding-agent";
import * as fs from "node:fs";
import * as path from "node:path";

const DEFAULT_THRESHOLD = 3;
const DEFAULT_THINKING_MAX_CHARS = 25000;
const DEFAULT_MESSAGES = [
  "Repetition warning: It seems like you might be stuck in a loop.",
  "Are you stuck? Maybe try a different approach.",
];

interface Config {
  threshold?: number;
  messages?: string[];
  thinkingMaxChars?: number;
}

function loadConfig(ctx: ExtensionContext): Config {
  const config: Config = {};
  // Try project-local first
  const projectPath = path.join(ctx.cwd, CONFIG_DIR_NAME, "extensions", "pi-yari.json");
  if (fs.existsSync(projectPath)) {
    Object.assign(config, JSON.parse(fs.readFileSync(projectPath, "utf-8")));
  } else {
    // Fall back to global
    const home = process.env.HOME || process.env.USERPROFILE;
    if (home) {
      const globalPath = path.join(home, CONFIG_DIR_NAME, "agent", "extensions", "pi-yari.json");
      if (fs.existsSync(globalPath)) {
        Object.assign(config, JSON.parse(fs.readFileSync(globalPath, "utf-8")));
      }
    }
  }

  return config;
}

export default function (pi: ExtensionAPI) {
  let threshold = DEFAULT_THRESHOLD;
  let thinkingMaxChars = DEFAULT_THINKING_MAX_CHARS;
  let messages = [...DEFAULT_MESSAGES];
  // Repetition tracker: null means no active streak
  let tracker: { toolName: string; argsKey: string; count: number } | null = null;

  pi.on("input", async (_event, ctx) => {
    const config = loadConfig(ctx);
    if (typeof config.threshold === "number" && config.threshold > 0) {
      threshold = config.threshold;
    }
    if (Array.isArray(config.messages) && config.messages.length > 0) {
      messages = config.messages;
    }
    if (typeof config.thinkingMaxChars === "number" && config.thinkingMaxChars > 0) {
      thinkingMaxChars = config.thinkingMaxChars;
    }
    tracker = null; // Reset tracker on new user chat message
  });

  pi.on("message_update", async (event, ctx) => {
    for (const part of event.message.content ?? []) {
      if (part.type === "thinking" && typeof part.thinking === "string") {
        if (part.thinking.length >= thinkingMaxChars) {
          ctx.abort();
          const msg = messages[Math.floor(Math.random() * messages.length)];
          pi.sendMessage({ customType: "pi-yari", content: msg, display: true });
          return;
        }
      }
    }
  });

  pi.on("tool_execution_start", async (event, ctx) => {
    const args = event.args ?? {};
    const argsKey = JSON.stringify(
      Object.entries(args).sort(([a], [b]) => a.localeCompare(b))
    );
    if (tracker?.toolName === event.toolName && tracker?.argsKey === argsKey) {
      if (++tracker.count >= threshold) {
        const warnMsg = messages[Math.floor(Math.random() * messages.length)];
        pi.sendMessage({ customType: "pi-yari", content: warnMsg, display: true });
        tracker = null; // reset counter after warning
      }
    } else {
      tracker = { toolName: event.toolName, argsKey, count: 1 };
    }
  });
}
