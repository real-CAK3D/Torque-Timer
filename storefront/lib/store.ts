import "server-only";
import { Redis } from "@upstash/redis";
import { ensureSupabase, supabase, supabaseConfigured, TABLE } from "./supabase";
import { promises as fs } from "fs";
import path from "path";

/**
 * Tiny key/value layer. Picks the first one that's set up:
 * 1. Supabase (default): SUPABASE_URL + SUPABASE_SECRET_KEY, added by Vercel's Supabase integration.
 * 2. Upstash Redis (optional alternative): KV_REST_API_URL / KV_REST_API_TOKEN.
 * 3. Neither (your own computer): saves to .data/db.json so you can try everything.
 */
interface KV {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  hincrby(key: string, field: string, by: number): Promise<void>;
  hgetall(key: string): Promise<Record<string, number>>;
}

const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const PREFIX = "shop:";

export const storageMode: "supabase" | "redis" | "file" = supabaseConfigured() ? "supabase" : url && token ? "redis" : "file";

function supabaseKV(): KV {
  const sb = () => ensureSupabase().then(() => supabase());
  return {
    async get<T>(k: string) {
      const { data, error } = await (await sb()).from(TABLE).select("value").eq("key", k).maybeSingle();
      if (error) throw new Error(error.message);
      return ((data?.value as T) ?? null) as T | null;
    },
    async set<T>(k: string, v: T) {
      const { error } = await (await sb()).from(TABLE).upsert({ key: k, value: v as unknown, updated_at: new Date().toISOString() });
      if (error) throw new Error(error.message);
    },
    async hincrby(k, f, by) {
      const { error } = await (await sb()).rpc("shop_hincrby", { p_key: k, p_field: f, p_by: by });
      if (error) throw new Error(error.message);
    },
    async hgetall(k) {
      const { data, error } = await (await sb()).from(TABLE).select("value").eq("key", k).maybeSingle();
      if (error) throw new Error(error.message);
      return Object.fromEntries(Object.entries((data?.value as Record<string, unknown>) ?? {}).map(([a, b]) => [a, Number(b)]));
    },
  };
}

function redisKV(): KV {
  const r = new Redis({ url: url!, token: token! });
  return {
    async get<T>(k: string) {
      return ((await r.get<T>(PREFIX + k)) ?? null) as T | null;
    },
    async set<T>(k: string, v: T) {
      await r.set(PREFIX + k, v);
    },
    async hincrby(k, f, by) {
      await r.hincrby(PREFIX + k, f, by);
    },
    async hgetall(k) {
      const res = (await r.hgetall<Record<string, number | string>>(PREFIX + k)) ?? {};
      return Object.fromEntries(Object.entries(res).map(([a, b]) => [a, Number(b)]));
    },
  };
}

function fileKV(): KV {
  const dir = path.join(process.cwd(), ".data");
  const file = path.join(dir, "db.json");
  let queue: Promise<unknown> = Promise.resolve();

  async function load(): Promise<Record<string, unknown>> {
    try {
      return JSON.parse(await fs.readFile(file, "utf8"));
    } catch {
      return {};
    }
  }
  async function save(db: Record<string, unknown>) {
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(file, JSON.stringify(db, null, 2));
  }
  // serialize writes so concurrent requests don't clobber each other
  function locked<T>(fn: () => Promise<T>): Promise<T> {
    const next = queue.then(fn, fn);
    queue = next.catch(() => undefined);
    return next;
  }
  return {
    async get<T>(k: string) {
      const db = await load();
      return (db[k] as T) ?? null;
    },
    set: (k, v) =>
      locked(async () => {
        const db = await load();
        db[k] = v;
        await save(db);
      }),
    hincrby: (k, f, by) =>
      locked(async () => {
        const db = await load();
        const h = (db[k] as Record<string, number>) ?? {};
        h[f] = (h[f] ?? 0) + by;
        db[k] = h;
        await save(db);
      }),
    async hgetall(k) {
      const db = await load();
      return (db[k] as Record<string, number>) ?? {};
    },
  };
}

export const kv: KV = storageMode === "supabase" ? supabaseKV() : storageMode === "redis" ? redisKV() : fileKV();
