// Starts the auction scheduler inside the Node.js server process.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { schedulerTick } = await import("@/features/auctions/engine");
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
  }
}
