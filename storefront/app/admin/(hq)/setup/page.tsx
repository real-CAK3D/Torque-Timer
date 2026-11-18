import { CopyButton } from "@/components/admin/CopyButton";
import { Block } from "@/components/admin/HelpBlocks";
import { Tabs } from "@/components/admin/Tabs";
import { PHASES, SETUP_STEPS, type SetupStep } from "@/lib/setup-steps";
import { getStatus, type Status } from "@/lib/status";
import { SETUP_SQL } from "@/lib/supabase";

export const metadata = { title: "Setup" };

function Step({ step, n, st, open }: { step: SetupStep; n: number; st: Status; open: boolean }) {
  const c = step.check ? st[step.check] : null;
  return (
    <li id={step.id} className={`panel setup-step ${c?.ok ? "is-done" : ""}`}>
      <details open={open}>
        <summary>
          <span className={`badge ${c ? (c.ok ? "ok" : "todo") : "info"}`} aria-hidden>{c?.ok ? "✓" : n}</span>
          <span className="setup-title">
            <strong>{step.title}</strong>
            <span className="muted small">
              {step.optional ? "Optional, " : ""}{step.time}
              {c ? `. ${c.detail}` : ""}
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
}

export default async function SetupPage() {
  const st = await getStatus();
  const isDone = (s: SetupStep) => (s.check ? st[s.check].ok : false);
  const required = SETUP_STEPS.filter((s) => s.check && !s.optional);
  const done = required.filter(isDone).length;
  const number = new Map(SETUP_STEPS.map((s, i) => [s.id, i + 1]));
  const phases = PHASES.map((ph) => {
    const steps = ph.steps.map((id) => SETUP_STEPS.find((s) => s.id === id)!);
    const checkable = steps.filter((s) => s.check && !s.optional);
    return { ...ph, steps, left: checkable.filter((s) => !isDone(s)).length, total: checkable.length };
  });
  const firstOpen = phases.find((p) => p.left > 0)?.id;

  return (
    <>
      <div className="page-head">
        <h1>Setup</h1>
        <span className="muted">{done} of {required.length} done</span>
      </div>
      <p className="muted lead">Go through the tabs in order. Steps turn green by themselves once they&apos;re done; refresh to re-check. The same steps are in SETUP.md on GitHub.</p>
      <div className="meter" role="progressbar" aria-valuemin={0} aria-valuemax={required.length} aria-valuenow={done}><span style={{ width: `${(done / required.length) * 100}%` }} /></div>
      <Tabs
        label="Setup stages"
        initial={firstOpen}
        tabs={phases.map((ph) => ({
          id: ph.id,
          label: ph.title,
          badge: ph.total ? (ph.left ? `${ph.total - ph.left}/${ph.total}` : "✓") : undefined,
          content: (
            <ol className="setup-steps">
              {ph.steps.map((s) => <Step key={s.id} step={s} n={number.get(s.id)!} st={st} open={s.id === (ph.steps.find((x) => !isDone(x)) ?? ph.steps[0]).id} />)}
            </ol>
          ),
        }))}
      />
    </>
  );
}
