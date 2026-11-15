// Production environment validation — fail fast at startup instead of
// silently running with localhost URLs, missing email config or unwritable
// data directories. Errors describe WHAT is wrong, never secret values.
import fs from "node:fs";
import path from "node:path";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

/** Returns a list of configuration problems (empty = valid). Pure/testable. */
export function validateEnv(
  env: Record<string, string | undefined> = process.env,
): string[] {
  // Development and test runs keep their permissive defaults.
  if (env.NODE_ENV !== "production") return [];

  const errors: string[] = [];

  // --- APP_BASE_URL -------------------------------------------------------
  const base = env.APP_BASE_URL;
  if (!base) {
    errors.push("APP_BASE_URL is required in production (used in password-reset links and absolute URLs).");
  } else {
    let u: URL | null = null;
    try {
      u = new URL(base);
    } catch {
      errors.push("APP_BASE_URL is not a valid URL (expected e.g. https://staging.example.com).");
    }
    if (u) {
      const isLocal = LOCAL_HOSTS.has(u.hostname);
      if (isLocal && env.ALLOW_LOCALHOST_DEPLOY !== "1") {
        errors.push(
          "APP_BASE_URL points to localhost — not valid for a public deployment. " +
            "Set ALLOW_LOCALHOST_DEPLOY=1 only for local demo/staging-simulation runs.",
        );
      } else if (!isLocal && u.protocol !== "https:") {
        errors.push("APP_BASE_URL must use https:// for a public deployment.");
      }
    }
  }

  // --- Email transport ----------------------------------------------------
  const transport = env.EMAIL_TRANSPORT ?? "outbox";
  if (transport === "webhook") {
    const hook = env.EMAIL_WEBHOOK_URL;
    if (!hook) {
      errors.push("EMAIL_TRANSPORT=webhook requires EMAIL_WEBHOOK_URL.");
    } else {
      try {
        const u = new URL(hook);
        if (u.protocol !== "https:" && !LOCAL_HOSTS.has(u.hostname))
          errors.push("EMAIL_WEBHOOK_URL should use https://.");
      } catch {
        errors.push("EMAIL_WEBHOOK_URL is not a valid URL.");
      }
    }
  } else if (transport === "outbox") {
    if (env.EMAIL_ALLOW_OUTBOX !== "1") {
      errors.push(
        "EMAIL_TRANSPORT=outbox is a development transport (writes to data/outbox.log). " +
          "Set EMAIL_ALLOW_OUTBOX=1 for closed demo environments, or configure EMAIL_TRANSPORT=webhook.",
      );
    }
  } else {
    errors.push(`Unknown EMAIL_TRANSPORT "${transport}" (supported: webhook, outbox).`);
  }

  // --- Filesystem ---------------------------------------------------------
  const dbPath = env.DATABASE_PATH ?? path.join(process.cwd(), "data", "autoauction.db");
  const docsDir = env.DOCUMENTS_DIR ?? path.join(process.cwd(), "data", "documents");
  for (const [name, dir] of [
    ["DATABASE_PATH directory", path.dirname(dbPath)],
    ["DOCUMENTS_DIR", docsDir],
  ] as const) {
    try {
      fs.mkdirSync(dir, { recursive: true });
      fs.accessSync(dir, fs.constants.W_OK);
    } catch {
      errors.push(`${name} (${dir}) is not writable by the application user.`);
    }
  }

  return errors;
}

/** Throws with a clear message when production config is invalid. */
export function assertEnv(): void {
  const errors = validateEnv();
  if (errors.length === 0) return;
  for (const e of errors) console.error(`[env] ${e}`);
  throw new Error(
    `Refusing to start: ${errors.length} invalid production environment setting${errors.length > 1 ? "s" : ""} (see above).`,
  );
}
