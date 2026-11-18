import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/*
 * Supabase: the default home for the shop's data and photos.
 *
 * Connecting Supabase to the project in Vercel (Storage > Supabase) fills in
 * SUPABASE_URL, SUPABASE_SECRET_KEY and POSTGRES_URL_NON_POOLING automatically.
 * On first run the app creates its table and photo bucket by itself.
 * If it can't (no POSTGRES_URL), Settings > Setup shows SETUP_SQL to paste
 * into Supabase's SQL editor once.
 */

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const dbUrl = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;

export const supabaseConfigured = () => Boolean(url && key);
export const BUCKET = "shop-images";
export const TABLE = "shop_kv";

export const SETUP_SQL = `-- Shop storage (safe to run more than once)
create table if not exists public.shop_kv (
  key text primary key,
  value jsonb,
  updated_at timestamptz not null default now()
);
alter table public.shop_kv enable row level security;
-- No policies: only the website's secret key can read or write.

create or replace function public.shop_hincrby(p_key text, p_field text, p_by integer)
returns void language sql security definer set search_path = public as $$
  insert into public.shop_kv (key, value, updated_at)
  values (p_key, jsonb_build_object(p_field, p_by), now())
  on conflict (key) do update
    set value = coalesce(public.shop_kv.value, '{}'::jsonb)
      || jsonb_build_object(p_field, coalesce((public.shop_kv.value ->> p_field)::bigint, 0) + p_by),
        updated_at = now();
$$;
revoke all on function public.shop_hincrby(text, text, integer) from public, anon, authenticated;
`;

let client: SupabaseClient | null = null;
export function supabase(): SupabaseClient {
  client ??= createClient(url!, key!, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}

let ready: Promise<void> | null = null;

export function ensureSupabase(): Promise<void> {
  ready ??= setup().catch((e) => {
    ready = null; // try again on the next request
    throw e;
  });
  return ready;
}

async function setup() {
  const sb = supabase();
  const probe = await sb.from(TABLE).select("key").limit(1);
  if (probe.error) {
    const missing = /does not exist|schema cache|PGRST205|42P01/i.test(`${probe.error.code} ${probe.error.message}`);
    if (!missing) throw new Error(`Supabase: ${probe.error.message}`);
    if (!dbUrl) {
      throw new Error("Supabase is connected but the shop table isn't set up yet. Open Settings > Setup in the dashboard and follow the database step.");
    }
    const { default: postgres } = await import("postgres");
    const sql = postgres(dbUrl, { max: 1, prepare: false, ssl: "require" });
    try {
      await sql.unsafe(SETUP_SQL);
      await sql.unsafe("notify pgrst, 'reload schema'");
    } finally {
      await sql.end({ timeout: 5 });
    }
    // give the API a moment to see the new table
    for (let i = 0; i < 10; i++) {
      const again = await sb.from(TABLE).select("key").limit(1);
      if (!again.error) break;
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  const buckets = await sb.storage.listBuckets();
  if (!buckets.error && !buckets.data.some((b) => b.name === BUCKET)) {
    await sb.storage.createBucket(BUCKET, { public: true, fileSizeLimit: 5 * 1024 * 1024, allowedMimeTypes: ["image/*"] });
  }
}

export async function supabaseStatus(): Promise<{ ok: boolean; message: string }> {
  if (!supabaseConfigured()) return { ok: false, message: "Not connected" };
  try {
    await ensureSupabase();
    return { ok: true, message: "Connected" };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}
