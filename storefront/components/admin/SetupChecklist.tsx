import Link from "next/link";
import { SETUP_STEPS } from "@/lib/setup-steps";
import { getStatus } from "@/lib/status";

/** "Finish setting up" box on the dashboard. Disappears when every required step is done. */
export async function SetupChecklist() {
  const st = await getStatus();
  const steps = SETUP_STEPS.filter((s) => s.check && !s.optional);
  const todo = steps.filter((s) => !st[s.check!].ok);
  if (!todo.length) return null;
  return (
    <section className="panel setup">
      <div className="panel-head"><h2>Finish setting up ({steps.length - todo.length} of {steps.length})</h2><Link href="/admin/setup">Open setup guide</Link></div>
      <ul className="checks">
        {steps.map((s) => (
          <li key={s.id} className={st[s.check!].ok ? "done" : ""}>
            <Link href={`/admin/setup#${s.id}`}>{s.title}</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
