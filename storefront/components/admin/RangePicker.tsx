import Link from "next/link";
export function RangePicker({ base, current }: { base: string; current: number }) {
  return (
    <div className="seg" role="group" aria-label="Time range">
      {[7, 30, 90, 365].map((d) => (
        <Link key={d} href={`${base}?days=${d}`} className={d === current ? "on" : ""} aria-current={d === current ? "true" : undefined}>
          {d === 365 ? "1 yr" : `${d} days`}
        </Link>
      ))}
    </div>
  );
}
