// In-process event bus for SSE broadcast. Single-node deploy (SQLite) only —
// documented constraint. Survives Next HMR via globalThis.
import { EventEmitter } from "node:events";

type Bus = EventEmitter & { publish(auctionId: string, event: string, data: unknown): void };

const g = globalThis as unknown as { __aaBus?: Bus };

export function bus(): Bus {
  if (!g.__aaBus) {
    const ee = new EventEmitter() as Bus;
    ee.setMaxListeners(0);
    ee.publish = (auctionId, event, data) => {
      ee.emit(`auction:${auctionId}`, { event, data });
      ee.emit("auction:*", { auctionId, event, data });
    };
    g.__aaBus = ee;
  }
  return g.__aaBus;
}
