"use client";
import { useState } from "react";

type Point = { label: string; value: number };

export function BarChart({ data, format, title, emptyText }: { data: Point[]; format: (n: number) => string; title: string; emptyText: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));
  const W = 640, H = 180, padL = 4, padB = 22, padT = 10;
  const bw = (W - padL) / data.length;
  const gap = Math.min(2, bw * 0.2);
  const total = data.reduce((n, d) => n + d.value, 0);
  const tickEvery = Math.ceil(data.length / 6);
  return (
    <figure className="chart">
      <figcaption>{title}</figcaption>
      {total === 0 ? (
        <p className="chart-empty muted">{emptyText}</p>
      ) : (
        <div className="chart-wrap" onMouseLeave={() => setHover(null)}>
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={title}>
            {[0.5, 1].map((f) => (
              <line key={f} x1={0} x2={W} y1={padT + (H - padT - padB) * (1 - f)} y2={padT + (H - padT - padB) * (1 - f)} className="grid" />
            ))}
            <line x1={0} x2={W} y1={H - padB} y2={H - padB} className="axis" />
            {data.map((d, i) => {
              const h = ((H - padT - padB) * d.value) / max;
              const x = padL + i * bw + gap / 2;
              const w = Math.max(1, bw - gap);
              const r = Math.min(4, w / 2, h);
              const y = H - padB - h;
              return (
                <g key={i}>
                  {h > 0 ? (
                    <path
                      d={`M${x},${H - padB} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${H - padB} Z`}
                      className={`bar ${hover === i ? "on" : ""}`}
                    />
                  ) : null}
                  <rect x={padL + i * bw} y={0} width={bw} height={H} fill="transparent" onMouseEnter={() => setHover(i)} onClick={() => setHover(i)} />
                </g>
              );
            })}
          </svg>
          <div className="chart-ticks" aria-hidden>
            {data.map((d, i) => (
              <span key={i} style={{ left: `${((i + 0.5) / data.length) * 100}%` }}>{i % tickEvery === 0 ? d.label : ""}</span>
            ))}
          </div>
          {hover !== null ? (
            <div className="tip" style={{ left: `${((hover + 0.5) / data.length) * 100}%` }}>
              <span>{data[hover].label}</span>
              <strong>{format(data[hover].value)}</strong>
            </div>
          ) : null}
        </div>
      )}
      <details className="chart-table">
        <summary>Show as table</summary>
        <table>
          <tbody>
            {data.filter((d) => d.value).map((d) => (
              <tr key={d.label}><td>{d.label}</td><td>{format(d.value)}</td></tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
