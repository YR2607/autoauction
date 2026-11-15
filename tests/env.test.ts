import { describe, it, expect } from "vitest";
import { validateEnv } from "@/lib/env";

const prod = { NODE_ENV: "production" };
const base = { ...prod, APP_BASE_URL: "https://staging.example.com", EMAIL_TRANSPORT: "webhook", EMAIL_WEBHOOK_URL: "https://mail.example.com/hook", DATABASE_PATH: "tests/tmp/env.db", DOCUMENTS_DIR: "tests/tmp/envdocs" };

describe("validateEnv", () => {
  it("skips validation outside production", () => {
    expect(validateEnv({ NODE_ENV: "development" })).toEqual([]);
    expect(validateEnv({ NODE_ENV: "test" })).toEqual([]);
  });

  it("accepts a correct production config", () => {
    expect(validateEnv({ ...base })).toEqual([]);
  });

  it("requires APP_BASE_URL in production", () => {
    const errors = validateEnv({ ...prod, EMAIL_TRANSPORT: "webhook", EMAIL_WEBHOOK_URL: "https://x.dev", DATABASE_PATH: "tests/tmp/e.db", DOCUMENTS_DIR: "tests/tmp/ed" });
    expect(errors.join()).toMatch(/APP_BASE_URL is required/);
  });

  it("rejects localhost APP_BASE_URL without the explicit opt-in", () => {
    const errors = validateEnv({ ...base, APP_BASE_URL: "http://localhost:3100" });
    expect(errors.join()).toMatch(/localhost/);
  });

  it("allows localhost only with ALLOW_LOCALHOST_DEPLOY=1", () => {
    expect(validateEnv({ ...base, APP_BASE_URL: "http://localhost:3100", ALLOW_LOCALHOST_DEPLOY: "1" })).toEqual([]);
  });

  it("rejects non-https public APP_BASE_URL", () => {
    const errors = validateEnv({ ...base, APP_BASE_URL: "http://staging.example.com" });
    expect(errors.join()).toMatch(/https/);
  });

  it("requires EMAIL_WEBHOOK_URL for webhook transport", () => {
    const { EMAIL_WEBHOOK_URL: _drop, ...noHook } = base;
    const errors = validateEnv(noHook);
    expect(errors.join()).toMatch(/EMAIL_WEBHOOK_URL/);
  });

  it("does not require EMAIL_WEBHOOK_URL for other transports", () => {
    expect(
      validateEnv({ ...base, EMAIL_TRANSPORT: "outbox", EMAIL_ALLOW_OUTBOX: "1", EMAIL_WEBHOOK_URL: undefined }),
    ).toEqual([]);
  });

  it("rejects outbox transport without the explicit opt-in", () => {
    const errors = validateEnv({ ...base, EMAIL_TRANSPORT: "outbox" });
    expect(errors.join()).toMatch(/outbox/);
  });

  it("rejects unknown transports", () => {
    const errors = validateEnv({ ...base, EMAIL_TRANSPORT: "smtp" });
    expect(errors.join()).toMatch(/Unknown EMAIL_TRANSPORT/);
  });

  it("never includes secret values in messages", () => {
    const errors = validateEnv({ ...base, EMAIL_WEBHOOK_URL: "https://mail.dev/hook?key=SUPERSECRET123" });
    expect(errors.join()).not.toMatch(/SUPERSECRET/);
  });
});
