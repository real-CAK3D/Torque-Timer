import { NextResponse } from "next/server";
import { saveImage } from "@/lib/upload";

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file");
  const folder = String(form.get("folder") || "images").replace(/[^a-z0-9-]/gi, "");
  if (!(file instanceof File)) return NextResponse.json({ error: "No image was attached." }, { status: 400 });
  try {
    return NextResponse.json({ url: await saveImage(file, folder) });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
