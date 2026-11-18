import Link from "next/link";
import { SETUP_STEPS } from "@/lib/setup-steps";
import { getStatus } from "@/lib/status";

export async function SetupChecklist() {
  const st = await getStatus();
  const steps = SETUP_STEPS.filter((s) => s.check && !s.optional);
  const todo = steps.filter((s) => !st[s.check!].ok);
  if (!todo.length) return null;
  const next = todo[0];
  return (
    <section className="panel setup-next">
      <div>
        <h2>Finish setting up</h2>
        <p className="muted">{steps.length - todo.length} of {steps.length} done. Next: <strong>{next.title}</strong></p>
      </div>
      <div className="meter"><span style={{ width: `${((steps.length - todo.length) / steps.length) * 100}%` }} /></div>
      <Link href={`/admin/setup#${next.id}`} className="b b-primary b-sm">Continue setup</Link>
    </section>
  );
}
