import { db, schema } from "@/lib/db";
import { DEFAULT_SETTINGS } from "@/config/defaults";
import { eq } from "drizzle-orm";

const cache = new Map<string, { value: unknown; at: number }>();
const TTL = 10_000;

export function getSetting<T>(key: string): T {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.value as T;
  const row = db
    .select()
    .from(schema.platformSettings)
    .where(eq(schema.platformSettings.key, key))
    .get();
  const value =
    row != null ? (JSON.parse(row.value) as T) : (DEFAULT_SETTINGS[key] as T);
  cache.set(key, { value, at: Date.now() });
  return value;
}

export function setSetting(key: string, value: unknown) {
  db.insert(schema.platformSettings)
    .values({ key, value: JSON.stringify(value) })
    .onConflictDoUpdate({
      target: schema.platformSettings.key,
      set: { value: JSON.stringify(value) },
    })
    .run();
  cache.delete(key);
}

export function invalidateSettingsCache() {
  cache.clear();
}
