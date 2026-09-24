import { Fragment, type ReactNode } from "react";
import { range, SAMPLE, SAMPLE_NOTE, usd } from "@/lib/premium-sample";

const { summary, damage, market } = SAMPLE;
const mapped = damage.areas.filter((area) => area.spot != null);

export function PremiumBadge() {
  return (
    <span className="badge">
      <span aria-hidden="true">✦</span>
      Premium
    </span>
  );
}

/** A premium section: dashed, badged, and saying its figures are samples. */
function PremiumCard({ title, className = "", children }: { title: string; className?: string; children: ReactNode }) {
  const id = `premium-${title.toLowerCase().replaceAll(" ", "-")}`;
  return (
    <section aria-labelledby={id} className={`card border-dashed ${className}`}>
      <div className="flex flex-wrap items-center gap-3">
        <PremiumBadge />
        <h2 id={id} className="text-base font-semibold">{title}</h2>
      </div>
      {children}
      <p className="hint mt-3">{SAMPLE_NOTE}</p>
    </section>
  );
}

export function PremiumSummary({ className }: { className?: string }) {
  return (
    <PremiumCard title="Summary" className={className}>
      <p className="mt-3 max-w-[65ch] text-lg">{summary.text}</p>
      <p className="hint mt-2">Best for: {summary.bestFor}</p>
    </PremiumCard>
  );
}

/** The car from above, front to the left, with each damaged area numbered where it is. */
export function DamageMap() {
  return (
    <div className="card border-dashed">
      <PremiumBadge />
      <svg
        role="img"
        aria-label={`Damage map: ${mapped.map((area) => `${area.spot} ${area.area.toLowerCase()}`).join(", ")}`}
        viewBox="0 0 400 200"
        className="mx-auto mt-4 w-full max-w-md"
      >
        <g fill="none" stroke="currentColor" strokeWidth="2" className="text-muted">
          <rect x="60" y="40" width="280" height="120" rx="60" />
          <rect x="130" y="60" width="36" height="80" rx="10" />
          <rect x="240" y="64" width="30" height="72" rx="10" />
        </g>
        <g className="fill-muted">
          {[95, 265].flatMap((x) => [30, 160].map((y) => <rect key={`${x}-${y}`} x={x} y={y} width="40" height="10" rx="4" />))}
        </g>
        <g className="fill-muted text-xs">
          <text x="30" y="104" textAnchor="middle">Front</text>
          <text x="370" y="104" textAnchor="middle">Rear</text>
        </g>
        {mapped.map((area) => (
          <g key={area.spot}>
            <circle cx={area.x} cy={area.y} r="16" className="fill-surface stroke-ink" strokeWidth="2" />
            <text x={area.x} y={area.y} dy="0.35em" textAnchor="middle" className="fill-ink text-sm font-semibold">
              {area.spot}
            </text>
          </g>
        ))}
      </svg>
      <ul className="mt-4 text-sm">
        {mapped.map((area) => (
          <li key={area.spot}>
            <span className="font-semibold">
              {area.spot} {area.area}, {area.severity.toLowerCase()}
            </span>{" "}
            · {area.seen.toLowerCase()}
          </li>
        ))}
      </ul>
      <p className="hint mt-3">{SAMPLE_NOTE}</p>
    </div>
  );
}

export function DamageReport({ className }: { className?: string }) {
  const total = [0, 1].map((end) => damage.areas.reduce((sum, area) => sum + area.estimate[end], 0)) as [number, number];
  return (
    <PremiumCard title="Damage report" className={className}>
      <dl className="mt-3 grid gap-4 sm:grid-cols-3">
        {[
          ["Primary", damage.primary],
          ["Secondary", damage.secondary],
          ["Insurer repair estimate", usd.format(damage.insurerEstimate)],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-sm text-muted">{label}</dt>
            <dd className="text-lg">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[32rem] text-left [&_td]:border-t [&_td]:border-line [&_td]:py-2 [&_td]:pr-4 [&_th]:pb-2 [&_th]:pr-4 [&_th]:text-sm [&_th]:font-normal [&_th]:text-muted">
          <thead>
            <tr>
              <th scope="col">Area</th>
              <th scope="col">What we see</th>
              <th scope="col">Severity</th>
              <th scope="col">Our estimate</th>
            </tr>
          </thead>
          <tbody>
            {damage.areas.map((area) => (
              <tr key={area.area}>
                <td>{[area.spot, area.area].filter(Boolean).join(" ")}</td>
                <td>{area.seen}</td>
                <td>{area.severity}</td>
                <td>{range(area.estimate, area.openEnded)}</td>
              </tr>
            ))}
            <tr className="font-semibold">
              <td>Total</td>
              <td className="font-normal text-muted">used parts</td>
              <td />
              <td>{range(total)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="hint mt-3">Why lower than the insurer? Insurer estimates use new parts and body-shop labor.</p>
    </PremiumCard>
  );
}

export function Market({ className }: { className?: string }) {
  const columns = [
    {
      title: "Value",
      rows: [
        ["Copart ACV", usd.format(market.acv)],
        ["Clean-title retail", usd.format(market.cleanRetail)],
        ["Resale with salvage title", usd.format(market.salvageResale)],
      ],
    },
    {
      title: "How it sells",
      rows: [
        ["Demand", market.demand],
        ["Avg. time to sell", `${market.daysToSell} days`],
        ["Similar lots sold (90 days)", String(market.similarSold90Days)],
      ],
    },
  ];
  return (
    <PremiumCard title="Market" className={className}>
      <div className="mt-3 grid gap-6 sm:grid-cols-2">
        {columns.map(({ title, rows }) => (
          <div key={title}>
            <h3 className="text-sm font-normal text-muted">{title}</h3>
            <dl className="mt-1 grid grid-cols-[1fr_auto] [&>*]:border-line [&>*]:py-2 [&>*:nth-child(n+3)]:border-t [&>dd]:text-right">
              {rows.map(([label, value]) => (
                <Fragment key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </Fragment>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </PremiumCard>
  );
}
