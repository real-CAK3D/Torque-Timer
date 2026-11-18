"use client";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { money, toCents } from "@/lib/format";
import type { Product } from "@/lib/types";
import { api } from "./api";
import { ImageList } from "./ImageField";

type Draft = Omit<Product, "price" | "compareAtPrice" | "stock" | "id" | "slug" | "createdAt" | "updatedAt"> & {
  id?: string;
  price: string;
  compareAtPrice: string;
  stock: string;
  optionValues: string;
};

const blank: Draft = { stripeProductId: undefined, name: "", price: "", compareAtPrice: "", summary: "", description: "", category: "", images: [], stock: "", madeToOrder: false, featured: false, active: true, option: null, optionValues: "" };

function toDraft(p: Product): Draft {
  return {
    ...p,
    price: (p.price / 100).toFixed(2),
    compareAtPrice: p.compareAtPrice ? (p.compareAtPrice / 100).toFixed(2) : "",
    stock: p.stock === null ? "" : String(p.stock),
    option: p.option ?? null,
    optionValues: p.option?.values.join(", ") ?? "",
  };
}

export function ProductManager({ initial, currency, views, lowAt, stripeOn, stripeTest }: { initial: Product[]; currency: string; views: Record<string, number>; lowAt: number; stripeOn: boolean; stripeTest: boolean }) {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");
  async function syncStripe() {
    setSyncing(true);
    setSyncMsg("");
    try {
      setSyncMsg((await api<{ message: string }>("/api/admin/stripe", "POST", { action: "sync" })).message);
      router.refresh();
      setTimeout(() => window.location.reload(), 600);
    } catch (e) {
      setSyncMsg((e as Error).message);
    }
    setSyncing(false);
  }
  const [list, setList] = useState(initial);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const categories = useMemo(() => [...new Set(list.map((p) => p.category).filter(Boolean))], [list]);
  const shown = list.filter((p) => !q || (p.name + p.category).toLowerCase().includes(q.toLowerCase()));

  async function save() {
    if (!editing) return;
    if (!editing.name.trim()) return setErr("Give the item a name.");
    if (!toCents(editing.price)) return setErr("Add a price.");
    setBusy(true);
    setErr("");
    const label = editing.option?.label?.trim() || "";
    const body = {
      ...editing,
      price: toCents(editing.price),
      compareAtPrice: editing.compareAtPrice ? toCents(editing.compareAtPrice) : null,
      stock: editing.stock.trim() === "" ? null : Number(editing.stock),
      option: label ? { label, values: editing.optionValues.split(",").map((v) => v.trim()).filter(Boolean) } : null,
    };
    try {
      const saved = await api<Product>("/api/admin/products", editing.id ? "PUT" : "POST", body);
      setList((l) => (editing.id ? l.map((p) => (p.id === saved.id ? saved : p)) : [saved, ...l]));
      setEditing(null);
      router.refresh();
    } catch (e) {
      setErr((e as Error).message);
    }
    setBusy(false);
  }

  async function remove(p: { id?: string; name: string }) {
    if (!p.id || !confirm(`Delete "${p.name}"? This can't be undone.`)) return;
    await api(`/api/admin/products?id=${p.id}`, "DELETE");
    setList((l) => l.filter((x) => x.id !== p.id));
    setEditing(null);
  }

  async function quick(p: Product, patch: Partial<Product>) {
    const saved = await api<Product>("/api/admin/products", "PUT", { ...p, ...patch });
    setList((l) => l.map((x) => (x.id === saved.id ? saved : x)));
  }

  if (editing) {
    const set = (patch: Partial<Draft>) => setEditing({ ...editing, ...patch });
    return (
      <>
        <div className="page-head">
          <h1>{editing.id ? "Edit item" : "New item"}</h1>
          <button className="b b-ghost" onClick={() => setEditing(null)}>Cancel</button>
        </div>
        {editing.stripeProductId ? (
          <p className="alert">
            This item comes from Stripe. Its name, price, description and photos update from Stripe; change them there so they don&apos;t get overwritten.{" "}
            <a href={`https://dashboard.stripe.com/${stripeTest ? "test/" : ""}products/${editing.stripeProductId}`} target="_blank" rel="noreferrer">Edit in Stripe</a>
          </p>
        ) : null}
        <div className="editor">
          <section className="panel stack">
            <label className="f"><span>Name</span><input value={editing.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Challenge Coin Display" /></label>
            <div className="row2">
              <label className="f"><span>Price</span><input inputMode="decimal" value={editing.price} onChange={(e) => set({ price: e.target.value })} placeholder="45.00" /></label>
              <label className="f"><span>Was price <em className="muted">(optional, shows a sale)</em></span><input inputMode="decimal" value={editing.compareAtPrice} onChange={(e) => set({ compareAtPrice: e.target.value })} /></label>
            </div>
            <label className="f"><span>Short description <em className="muted">(shown on the shop page)</em></span><input value={editing.summary} onChange={(e) => set({ summary: e.target.value })} maxLength={300} placeholder="One line that sells it" /></label>
            <label className="f"><span>Full description</span><textarea rows={7} value={editing.description} onChange={(e) => set({ description: e.target.value })} placeholder={"Materials, size, care, how it's made.\n\nLeave a blank line between paragraphs."} /></label>
            <label className="f">
              <span>Category</span>
              <input list="cats" value={editing.category} onChange={(e) => set({ category: e.target.value })} placeholder="e.g. Woodwork" />
              <datalist id="cats">{categories.map((c) => <option key={c} value={c} />)}</datalist>
            </label>
            <ImageList value={editing.images} onChange={(images) => set({ images })} folder="products" />
          </section>
          <section className="panel stack">
            <h2>Stock</h2>
            <label className="f"><span>How many do you have? <em className="muted">(leave empty for unlimited)</em></span><input inputMode="numeric" value={editing.stock} onChange={(e) => set({ stock: e.target.value.replace(/[^0-9]/g, "") })} /></label>
            <label className="check"><input type="checkbox" checked={editing.madeToOrder} onChange={(e) => set({ madeToOrder: e.target.checked })} /> Made to order</label>
            <h2>Choices</h2>
            <p className="hint">Let customers pick a size, color, wood, etc.</p>
            <label className="f"><span>Choice name</span><input value={editing.option?.label ?? ""} onChange={(e) => set({ option: { label: e.target.value, values: [] } })} placeholder="e.g. Color" /></label>
            <label className="f"><span>Options, separated by commas</span><input value={editing.optionValues} onChange={(e) => set({ optionValues: e.target.value })} placeholder="Black, Brown, Natural" /></label>
            <h2>Visibility</h2>
            <label className="check"><input type="checkbox" checked={editing.active} onChange={(e) => set({ active: e.target.checked })} /> Show in the shop</label>
            <label className="check"><input type="checkbox" checked={editing.featured} onChange={(e) => set({ featured: e.target.checked })} /> Feature at the top</label>
          </section>
        </div>
        <div className="savebar">
          {editing.id ? <button className="b b-danger" onClick={() => remove(editing)}>Delete item</button> : <span />}
          {err ? <span className="err">{err}</span> : null}
          <button className="b b-primary" onClick={save} disabled={busy}>{busy ? "Saving…" : editing.id ? "Save changes" : "Add item"}</button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="page-head">
        <h1>Products</h1>
        <div className="row wrap">
          {stripeOn ? <button className="b" onClick={syncStripe} disabled={syncing}>{syncing ? "Syncing…" : "Sync from Stripe"}</button> : null}
          {stripeOn ? <a className="b b-ghost" href={`https://dashboard.stripe.com/${stripeTest ? "test/" : ""}products/create`} target="_blank" rel="noreferrer">Add in Stripe</a> : null}
          <button className="b b-primary" onClick={() => { setErr(""); setEditing({ ...blank }); }}>Add item</button>
        </div>
      </div>
      {syncMsg ? <p className="alert" role="status">{syncMsg}</p> : null}
      {list.length > 6 ? <input className="search" placeholder="Search items" value={q} onChange={(e) => setQ(e.target.value)} /> : null}
      {shown.length ? (
        <ul className="plist">
          {shown.map((p) => (
            <li key={p.id} className={p.active ? "" : "hidden-item"}>
              <button className="plist-main" onClick={() => { setErr(""); setEditing(toDraft(p)); }}>
                <span className="plist-thumb">{/* eslint-disable-next-line @next/next/no-img-element */}{p.images[0] ? <img src={p.images[0]} alt="" /> : null}</span>
                <span className="plist-name">
                  <strong>{p.name}</strong>
                  <span className="muted">{[p.stripeProductId ? "From Stripe" : null, p.category, p.active ? null : "Hidden", p.featured ? "Featured" : null].filter(Boolean).join(", ")}</span>
                </span>
                <span className="plist-meta">
                  <strong>{money(p.price, currency)}</strong>
                  <span className={p.stock !== null && p.stock <= lowAt ? "warn-text" : "muted"}>{p.stock === null ? (p.madeToOrder ? "Made to order" : "Unlimited") : `${p.stock} in stock`}</span>
                  <span className="muted">{views[p.id] ?? 0} views</span>
                </span>
              </button>
              <label className="switch" title="Show in shop">
                <input type="checkbox" checked={p.active} onChange={(e) => quick(p, { active: e.target.checked })} aria-label={`Show ${p.name} in shop`} />
                <span />
              </label>
            </li>
          ))}
        </ul>
      ) : (
        <div className="panel"><p>No items yet. Add your first one and it shows up in the shop right away.</p></div>
      )}
    </>
  );
}
