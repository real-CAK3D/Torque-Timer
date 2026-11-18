import type { Metadata } from "next";
import Link from "next/link";
import { About } from "@/components/shop/Sections";
import { Tracker } from "@/components/shop/Tracker";
import { getSettings } from "@/lib/db";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getSettings()).aboutTitle };
}

export default async function AboutPage() {
  const s = await getSettings();
  return (
    <>
      <Tracker />
      <About s={s} />
      <p className="page-next">
        <Link href="/shop" className="btn">See the work</Link>
        <Link href="/contact" className="btn btn-ghost">Get in touch</Link>
      </p>
    </>
  );
}
