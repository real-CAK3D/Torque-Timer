import "server-only";
import { put } from "@vercel/blob";
import { promises as fs } from "fs";
import path from "path";
import { BUCKET, ensureSupabase, supabase, supabaseConfigured } from "./supabase";

export const blobConfigured = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);
export const imageStorage = (): "supabase" | "blob" | "local" => (supabaseConfigured() ? "supabase" : blobConfigured() ? "blob" : "local");
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml", "image/avif"];

export async function saveImage(file: File, folder: string): Promise<string> {
  if (!ALLOWED.includes(file.type)) throw new Error("Use a JPG, PNG, WebP, GIF or SVG image.");
  if (file.size > 4_400_000) throw new Error("That image is over 4 MB. Try a smaller one.");
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const name = `${folder}/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}.${ext}`;

  if (supabaseConfigured()) {
    await ensureSupabase();
    const sb = supabase();
    const { error } = await sb.storage.from(BUCKET).upload(name, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: false, cacheControl: "31536000" });
    if (error) throw new Error(`Upload failed: ${error.message}`);
    return sb.storage.from(BUCKET).getPublicUrl(name).data.publicUrl;
  }
  if (blobConfigured()) {
    const res = await put(name, file, { access: "public", contentType: file.type });
    return res.url;
  }
  if (process.env.VERCEL) throw new Error("Photo storage isn't connected yet. Connect Supabase in Vercel (Storage), then redeploy.");
  const dest = path.join(process.cwd(), "public", "uploads", name);
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.writeFile(dest, Buffer.from(await file.arrayBuffer()));
  return `/uploads/${name}`;
}
