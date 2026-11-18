import "server-only";
import { put } from "@vercel/blob";
import { promises as fs } from "fs";
import path from "path";

export const blobConfigured = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml", "image/avif"];

export async function saveImage(file: File, folder: string): Promise<string> {
  if (!ALLOWED.includes(file.type)) throw new Error("Use a JPG, PNG, WebP, GIF or SVG image.");
  if (file.size > 4_400_000) throw new Error("That image is over 4 MB. Try a smaller one.");
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const name = `${folder}/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}.${ext}`;

  if (blobConfigured()) {
    const res = await put(name, file, { access: "public", contentType: file.type });
    return res.url;
  }
  if (process.env.VERCEL) throw new Error("Image storage isn't connected yet. Add Vercel Blob in Settings.");
  const dest = path.join(process.cwd(), "public", "uploads", name);
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.writeFile(dest, Buffer.from(await file.arrayBuffer()));
  return `/uploads/${name}`;
}
