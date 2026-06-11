import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/** Minimal .env loader so scripts don't need an extra dependency. */
export function loadEnv(file = ".env.local") {
  for (const candidate of [file, ".env"]) {
    try {
      const content = readFileSync(resolve(process.cwd(), candidate), "utf8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eq = trimmed.indexOf("=");
        if (eq === -1) continue;
        const key = trimmed.slice(0, eq).trim();
        let value = trimmed.slice(eq + 1).trim();
        value = value.replace(/^["']|["']$/g, "");
        if (!(key in process.env)) process.env[key] = value;
      }
    } catch {
      /* file not found — ignore */
    }
  }
}
