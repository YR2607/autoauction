import { describe, it, expect, vi } from "vitest";

describe("GET /api/health", () => {
  it("returns a minimal healthy payload", async () => {
    const { GET } = await import("@/app/api/health/route");
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.db).toBe("ok");
    // No diagnostic details that help fingerprinting.
    expect(JSON.stringify(body)).not.toMatch(/sqlite|version|\/app\/|\.db|error/i);
  });

  it("returns 503 with a generic error code when the db is down", async () => {
    vi.resetModules();
    vi.doMock("@/lib/db", () => ({
      sqlite: {
        prepare: () => {
          throw new Error("SQLITE_CANTOPEN: unable to open database file /app/data/secret.db");
        },
      },
    }));
    const { GET } = await import("@/app/api/health/route");
    const res = await GET();
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toBe("database_unavailable");
    // Internal exception text, SQL errors and paths must not leak.
    expect(JSON.stringify(body)).not.toMatch(/SQLITE|\/app\/|secret\.db/);
  });
});
