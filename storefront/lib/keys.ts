import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import { kv } from "./store";

/*
 *  EDIT-POINT: API-KEYS
 *  The keys the owner can paste in under Dashboard > Keys.
 *  Each key is looked up in this order:
 *    1. a Vercel environment variable with the same name (envName), then
 *    2. the value saved in the dashboard (stored encrypted in the database).
 *  To support a new service, add an entry to KEY_DEFS and read it anywhere
 *  on the server with:  await getKey("YOUR_ENV_NAME")
 *  Keys added under "Other keys" in the dashboard work the same way.
 */

export type KeyDef = {
  envName: string;
  label: string;
  group: string;
  where: string; // how to find it, in plain words
  link?: string;
  prefix?: RegExp; // quick sanity check of the format
  secret: boolean; // hide the value after saving
};

export const KEY_DEFS: KeyDef[] = [
  {
    envName: "STRIPE_SECRET_KEY",
    label: "Stripe secret key",
    group: "Stripe",
    where: "Stripe > Developers > API keys > Secret key. Starts with sk_test_ (practice) or sk_live_ (real money). A restricted key (rk_) works too.",
    link: "https://dashboard.stripe.com/apikeys",
    prefix: /^(sk|rk)_(test|live)_/,
    secret: true,
  },
  {
    envName: "STRIPE_WEBHOOK_SECRET",
    label: "Stripe webhook signing secret",
    group: "Stripe",
    where: "Filled in for you by the \"Connect Stripe webhook\" button. Or: Stripe > Developers > Webhooks > your endpoint > Signing secret (starts with whsec_).",
    link: "https://dashboard.stripe.com/webhooks",
    prefix: /^whsec_/,
    secret: true,
  },
  {
    envName: "NEXT_PUBLIC_VAPID_PUBLIC_KEY",
    label: "Notification public key",
    group: "Phone notifications",
    where: "Press \"Create notification keys\" and both are made for you.",
    secret: false,
  },
  {
    envName: "VAPID_PRIVATE_KEY",
    label: "Notification private key",
    group: "Phone notifications",
    where: "Made together with the public key.",
    secret: true,
  },
  {
    envName: "RESEND_API_KEY",
    label: "Resend API key (optional)",
    group: "Email",
    where: "Lets the site email customers their tracking numbers. Free at resend.com > API Keys. Starts with re_.",
    link: "https://resend.com/api-keys",
    prefix: /^re_/,
    secret: true,
  },
];

type Sealed = { iv: string; tag: string; data: string; savedAt: string };
type Vault = Record<string, Sealed>;
const VAULT = "secrets";

function cipherKey() {
  const base = process.env.AUTH_SECRET || process.env.SUPABASE_JWT_SECRET || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "local-development-only";
  return createHash("sha256").update("shop-keys:" + base).digest();
}

export const strongEncryption = () => Boolean(process.env.AUTH_SECRET || process.env.SUPABASE_JWT_SECRET);

function seal(value: string): Sealed {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", cipherKey(), iv);
  const data = Buffer.concat([c.update(value, "utf8"), c.final()]);
  return { iv: iv.toString("base64"), tag: c.getAuthTag().toString("base64"), data: data.toString("base64"), savedAt: new Date().toISOString() };
}

function open(s: Sealed): string | null {
  try {
    const d = createDecipheriv("aes-256-gcm", cipherKey(), Buffer.from(s.iv, "base64"));
    d.setAuthTag(Buffer.from(s.tag, "base64"));
    return Buffer.concat([d.update(Buffer.from(s.data, "base64")), d.final()]).toString("utf8");
  } catch {
    return null; // the encryption secret changed; the key has to be pasted again
  }
}

let cache: { at: number; vault: Vault } | null = null;
async function vault(): Promise<Vault> {
  if (cache && Date.now() - cache.at < 30_000) return cache.vault;
  const v = (await kv.get<Vault>(VAULT)) ?? {};
  cache = { at: Date.now(), vault: v };
  return v;
}

export const validName = (n: string) => /^[A-Z][A-Z0-9_]{1,59}$/.test(n);

export async function getKey(envName: string): Promise<string | null> {
  const fromEnv = process.env[envName];
  if (fromEnv) return fromEnv;
  try {
    const s = (await vault())[envName];
    return s ? open(s) : null;
  } catch {
    return null;
  }
}

export async function saveKey(envName: string, value: string) {
  if (!validName(envName)) throw new Error("Key names use capital letters, numbers and underscores, like MY_SERVICE_KEY.");
  const v = { ...(await kv.get<Vault>(VAULT)) };
  v[envName] = seal(value.trim());
  await kv.set(VAULT, v);
  cache = null;
}

export async function removeKey(envName: string) {
  const v = { ...(await kv.get<Vault>(VAULT)) };
  delete v[envName];
  await kv.set(VAULT, v);
  cache = null;
}

export type KeyStatus = {
  envName: string;
  label: string;
  group: string;
  where: string;
  link?: string;
  secret: boolean;
  source: "vercel" | "dashboard" | "unreadable" | "missing";
  preview: string; // masked
  savedAt?: string;
  custom: boolean;
};

const mask = (v: string, secret: boolean) => (secret ? (v.length > 12 ? `${v.slice(0, 8)}…${v.slice(-4)}` : "••••••") : v.length > 28 ? `${v.slice(0, 24)}…` : v);

export async function keyStatuses(): Promise<KeyStatus[]> {
  const v = await kv.get<Vault>(VAULT).then((x) => x ?? {});
  // drop `prefix`: a RegExp can't be passed to a client component
  const defs: (Omit<KeyDef, "prefix"> & { custom: boolean })[] = [
    ...KEY_DEFS.map(({ envName, label, group, where, link, secret }) => ({ envName, label, group, where, link, secret, custom: false })),
    ...Object.keys(v)
      .filter((n) => !KEY_DEFS.some((d) => d.envName === n))
      .sort()
      .map((n) => ({ envName: n, label: n, group: "Other keys", where: "Added by you.", secret: true, custom: true })),
  ];
  return defs.map((d) => {
    const env = process.env[d.envName];
    if (env) return { ...d, source: "vercel" as const, preview: mask(env, d.secret) };
    const s = v[d.envName];
    if (!s) return { ...d, source: "missing" as const, preview: "" };
    const val = open(s);
    return val === null
      ? { ...d, source: "unreadable" as const, preview: "", savedAt: s.savedAt }
      : { ...d, source: "dashboard" as const, preview: mask(val, d.secret), savedAt: s.savedAt };
  });
}

export function checkFormat(envName: string, value: string): string | null {
  const def = KEY_DEFS.find((d) => d.envName === envName);
  if (!value.trim()) return "Paste the key first.";
  if (def?.prefix && !def.prefix.test(value.trim())) return `That doesn't look like a ${def.label}. ${def.where}`;
  return null;
}
