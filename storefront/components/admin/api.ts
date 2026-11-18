export async function api<T = unknown>(url: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) window.location.href = "/admin/login";
  if (!res.ok) throw new Error(data.error || "Something went wrong. Try again.");
  return data as T;
}

// phone photos are often 5MB+, which is over Vercel's upload limit
async function shrink(file: File, maxSide = 1800): Promise<Blob> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file;
  const bmp = await createImageBitmap(file).catch(() => null);
  if (!bmp) return file;
  const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  if (scale === 1 && file.size < 1_500_000) return file;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  const type = file.type === "image/png" ? "image/png" : "image/jpeg";
  return new Promise((r) => canvas.toBlob((b) => r(b ?? file), type, 0.86));
}

export async function uploadImage(file: File, folder: string): Promise<string> {
  const blob = await shrink(file);
  const ext = blob.type === "image/png" ? "png" : blob.type === "image/jpeg" ? "jpg" : file.name.split(".").pop();
  const form = new FormData();
  form.append("file", new File([blob], `upload.${ext}`, { type: blob.type || file.type }));
  form.append("folder", folder);
  const res = await fetch("/api/admin/upload", { method: "POST", body: form });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Upload failed.");
  return data.url;
}
