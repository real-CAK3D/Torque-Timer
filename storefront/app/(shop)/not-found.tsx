import Link from "next/link";

export default function NotFound() {
  return (
    <section className="section empty-page">
      <h1>Nothing here</h1>
      <p className="lede">That page or item isn&apos;t in the shop anymore. It may have sold out or moved.</p>
      <Link href="/" className="btn">Back to the shop</Link>
    </section>
  );
}
