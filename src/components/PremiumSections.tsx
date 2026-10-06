import { SparklesIcon } from "lucide-react";
import { Fragment, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { range, SAMPLE, SAMPLE_NOTE, usd } from "@/lib/premium-sample";

const { summary, damage, market } = SAMPLE;
const mapped = damage.areas.filter((area) => area.spot != null);

export function PremiumBadge() {
  return (
    <Badge variant="secondary">
      <SparklesIcon aria-hidden="true" />
      Premium
    </Badge>
  );
}

/** A dashed card: the look of every premium section. */
const DASHED = "border border-dashed ring-0";

/** A premium section: dashed, badged, and saying its figures are samples. */
function PremiumCard({ title, className, children }: { title: string; className?: string; children: ReactNode }) {
  const id = `premium-${title.toLowerCase().replaceAll(" ", "-")}`;
  return (
    <section aria-labelledby={id} className={className}>
      <Card className={DASHED}>
        <CardHeader className="flex flex-wrap items-center gap-3">
          <PremiumBadge />
          <h2 id={id} className="font-heading text-base font-semibold">{title}</h2>
        </CardHeader>
        <CardContent>
          {children}
          <p className="mt-3 text-sm text-muted-foreground">{SAMPLE_NOTE}</p>
        </CardContent>
      </Card>
    </section>
  );
}

export function PremiumSummary({ className }: { className?: string }) {
  return (
    <PremiumCard title="Summary" className={className}>
      <p className="max-w-[65ch] text-lg">{summary.text}</p>
      <p className="mt-2 text-sm text-muted-foreground">Best for: {summary.bestFor}</p>
    </PremiumCard>
  );
}

/** The car from above, front to the left, with each damaged area numbered where it is. */
export function DamageMap() {
  return (
    <Card className={DASHED}>
      <CardContent>
        <PremiumBadge />
        <svg
          role="img"
          aria-label={`Damage map: ${mapped.map((area) => `${area.spot} ${area.area.toLowerCase()}`).join(", ")}`}
          viewBox="0 0 400 200"
          className="mx-auto mt-4 w-full max-w-md"
        >
          <g fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground">
            <rect x="60" y="40" width="280" height="120" rx="60" />
            <rect x="130" y="60" width="36" height="80" rx="10" />
            <rect x="240" y="64" width="30" height="72" rx="10" />
          </g>
          <g className="fill-muted-foreground">
            {[95, 265].flatMap((x) => [30, 160].map((y) => <rect key={`${x}-${y}`} x={x} y={y} width="40" height="10" rx="4" />))}
          </g>
          <g className="fill-muted-foreground text-xs">
            <text x="30" y="104" textAnchor="middle">Front</text>
            <text x="370" y="104" textAnchor="middle">Rear</text>
          </g>
          {mapped.map((area) => (
            <g key={area.spot}>
              <circle cx={area.x} cy={area.y} r="16" className="fill-background stroke-foreground" strokeWidth="2" />
              <text x={area.x} y={area.y} dy="0.35em" textAnchor="middle" className="fill-foreground text-sm font-semibold">
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
        <p className="mt-3 text-sm text-muted-foreground">{SAMPLE_NOTE}</p>
      </CardContent>
    </Card>
  );
}

export function DamageReport({ className }: { className?: string }) {
  const total = [0, 1].map((end) => damage.areas.reduce((sum, area) => sum + area.estimate[end], 0)) as [number, number];
  return (
    <PremiumCard title="Damage report" className={className}>
      <dl className="grid gap-4 sm:grid-cols-3">
        {[
          ["Primary", damage.primary],
          ["Secondary", damage.secondary],
          ["Insurer repair estimate", usd.format(damage.insurerEstimate)],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="text-lg">{value}</dd>
          </div>
        ))}
      </dl>
      <Table className="mt-4 min-w-[32rem]">
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Area</TableHead>
            <TableHead scope="col">What we see</TableHead>
            <TableHead scope="col">Severity</TableHead>
            <TableHead scope="col">Our estimate</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {damage.areas.map((area) => (
            <TableRow key={area.area}>
              <TableCell>{[area.spot, area.area].filter(Boolean).join(" ")}</TableCell>
              <TableCell className="whitespace-normal">{area.seen}</TableCell>
              <TableCell>{area.severity}</TableCell>
              <TableCell>{range(area.estimate, area.openEnded)}</TableCell>
            </TableRow>
          ))}
          <TableRow className="font-semibold">
            <TableCell>Total</TableCell>
            <TableCell className="font-normal text-muted-foreground">used parts</TableCell>
            <TableCell />
            <TableCell>{range(total)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <p className="mt-3 text-sm text-muted-foreground">Why lower than the insurer? Insurer estimates use new parts and body-shop labor.</p>
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
      <div className="grid gap-6 sm:grid-cols-2">
        {columns.map(({ title, rows }) => (
          <div key={title}>
            <h3 className="text-sm font-normal text-muted-foreground">{title}</h3>
            <dl className="mt-1 grid grid-cols-[1fr_auto] [&>*]:py-2 [&>*:nth-child(n+3)]:border-t [&>dd]:text-right">
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
