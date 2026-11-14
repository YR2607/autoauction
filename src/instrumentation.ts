// Starts the auction scheduler inside the Node.js server process.
//
// Deployment topology: SINGLE long-running Node process per SQLite database.
// The scheduler and the SSE bus are in-process — they only work when the app
// runs as one instance (systemd service, single container, single VM process).
// Running multiple instances against one SQLite file is safe for correctness
// (serialized writer + absolute timestamps make duplicate ticks idempotent)
// but SSE events would only reach clients connected to the emitting instance.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { schedulerTick } = await import("@/features/auctions/engine");
  const { sqlite } = await import("@/lib/db");

  const g = globalThis as unknown as { __aaScheduler?: NodeJS.Timeout };
  if (!g.__aaScheduler) {
    g.__aaScheduler = setInterval(() => {
      try {
        schedulerTick();
      } catch (e) {
        console.error("scheduler tick failed", e);
      }
    }, 5_000);
  }

  // Graceful shutdown — close the DB cleanly so WAL checkpoints complete
  // and no transactions are cut mid-flight.
  const sg = globalThis as unknown as { __aaShutdownHooked?: boolean };
  if (!sg.__aaShutdownHooked) {
    sg.__aaShutdownHooked = true;
    const shutdown = (sig: string) => {
      console.log(`${sig} received — shutting down`);
      if (g.__aaScheduler) clearInterval(g.__aaScheduler);
      try {
        sqlite.close();
      } catch {
        /* already closed */
      }
      process.exit(0);
    };
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  }
}
