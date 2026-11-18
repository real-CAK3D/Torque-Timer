import { Block } from "@/components/admin/HelpBlocks";
import { CopyButton } from "@/components/admin/CopyButton";
import { SETUP_STEPS } from "@/lib/setup-steps";
import { getStatus } from "@/lib/status";
import { SETUP_SQL } from "@/lib/supabase";

export const metadata = { title: "Setup" };

export default async function SetupPage() {
  const st = await getStatus();
  const required = SETUP_STEPS.filter((s) => s.check && !s.optional);
  const done = required.filter((s) => st[s.check!].ok).length;
  return (
    <>
      <div className="page-head">
        <h1>Setup</h1>
        <span className="muted">{done} of {required.length} done</span>
      </div>
      <p className="muted lead">Work down the list. Each step turns green by itself once it&apos;s done; refresh this page to re-check. The same steps are in SETUP.md on GitHub.</p>
      <div className="meter" role="progressbar" aria-valuemin={0} aria-valuemax={required.length} aria-valuenow={done}><span style={{ width: `${(done / required.length) * 100}%` }} /></div>
      <ol className="setup-steps">
        {SETUP_STEPS.map((step) => {
          const c = step.check ? st[step.check] : null;
          return (
            <li key={step.id} id={step.id} className={`panel setup-step ${c?.ok ? "is-done" : ""}`}>
              <details open={!c?.ok}>
                <summary>
                  <span className={`badge ${c ? (c.ok ? "ok" : "todo") : "info"}`} aria-hidden>{c?.ok ? "✓" : ""}</span>
                  <span className="setup-title">
                    <strong>{step.title}</strong>
                    <span className="muted small">
                      {step.optional ? "Optional · " : ""}{step.time}
                      {c ? ` · ${c.detail}` : ""}
                    </span>
                  </span>
                </summary>
                <div className="help-body">
                  {step.blocks.map((b, i) => <Block key={i} b={b} />)}
                  {step.id === "password" && !st.secret.ok ? <p className="help-tip">{st.secret.detail}</p> : null}
                  {step.id === "supabase" && !st.database.ok && st.database.detail.includes("table") ? (
                    <>
                      <pre className="brief">{SETUP_SQL}</pre>
                      <CopyButton text={SETUP_SQL} label="Copy SQL" />
                    </>
                  ) : null}
                  {step.links?.length ? (
                    <div className="row wrap step-links">
                      {step.links.map((l) => (
                        <a key={l.url} className="b b-sm" href={l.url} {...(l.url.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}>{l.label}</a>
                      ))}
                    </div>
                  ) : null}
                </div>
              </details>
            </li>
          );
        })}
      </ol>
    </>
  );
}
