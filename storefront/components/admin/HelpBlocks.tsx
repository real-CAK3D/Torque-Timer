import { Fragment } from "react";
import type { HelpBlock } from "@/lib/help";

export function Rich({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("**") ? <strong key={i}>{p.slice(2, -2)}</strong> : p.startsWith("`") ? <code key={i}>{p.slice(1, -1)}</code> : <Fragment key={i}>{p}</Fragment>
      )}
    </>
  );
}

export function Block({ b }: { b: HelpBlock }) {
  if ("p" in b) return <p><Rich text={b.p} /></p>;
  if ("h" in b) return <h3>{b.h}</h3>;
  if ("tip" in b) return <p className="help-tip"><Rich text={b.tip} /></p>;
  if ("list" in b) return <ul>{b.list.map((x, i) => <li key={i}><Rich text={x} /></li>)}</ul>;
  return <ol>{b.steps.map((x, i) => <li key={i}><Rich text={x} /></li>)}</ol>;
}

