import type { Metadata } from "next";
import { Contact } from "@/components/shop/Sections";
import { Tracker } from "@/components/shop/Tracker";
import { getSettings } from "@/lib/db";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getSettings()).contactHeading };
}

export default async function ContactPage() {
  const s = await getSettings();
  return (
    <>
      <Tracker />
      <Contact s={s} always />
    </>
  );
}
