import { SparklesIcon } from "lucide-react";
import { Fragment, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fill, type I18n } from "@/lib/i18n";
import { range, SAMPLE, usd } from "@/lib/premium-sample";
import type { Messages } from "@/messages/en";

const { damage, market } = SAMPLE;

/** The sample's areas, each with its words in the page's language. */
const areasIn = (m: Messages) => damage.areas.map((area, index) => ({ ...area, ...m.premium.sample.areas[index] }));

export function PremiumBadge({ m }: { m: Messages }) {
  return (
    <Badge variant="secondary">
      <SparklesIcon aria-hidden="true" />
      {m.premium.badge}
    </Badge>
  );
}

/** A dashed card: the look of every premium section. */
const DASHED = "border-dashed";

type Section = { i18n: I18n; className?: string };

/** A premium section: dashed, badged, and saying its figures are samples. */
function PremiumCard({ id, title, m, className, children }: { id: string; title: string; m: Messages; className?: string; children: ReactNode }) {
  return (
    <section aria-labelledby={`premium-${id}`} className={className}>
      <Card className={DASHED}>
        <CardHeader className="flex flex-wrap items-center gap-3">
          <PremiumBadge m={m} />
          <CardTitle id={`premium-${id}`}>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          {children}
          <p className="mt-3 text-sm text-muted-foreground">{m.premium.sampleNote}</p>
        </CardContent>
      </Card>
    </section>
  );
}

export function PremiumSummary({ i18n: { m }, className }: Section) {
  return (
    <PremiumCard id="summary" title={m.premium.summary} m={m} className={className}>
      <p className="max-w-[65ch] text-lg">{m.premium.sample.summary}</p>
      <p className="mt-2 text-sm text-muted-foreground">{fill(m.premium.bestFor, { use: m.premium.sample.bestFor })}</p>
    </PremiumCard>
  );
}

/** The car from above, front to the left, with each damaged area numbered where it is. */
export function DamageMap({ m }: { m: Messages }) {
  const mapped = areasIn(m).filter((area) => area.spot != null);
  return (
    <Card className={DASHED}>
      <CardContent>
        <PremiumBadge m={m} />
        <svg
          role="img"
          aria-label={fill(m.premium.damageMap, { areas: mapped.map((area) => `${area.spot} ${area.area.toLowerCase()}`).join(", ") })}
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
            <text x="30" y="104" textAnchor="middle">{m.premium.front}</text>
            <text x="370" y="104" textAnchor="middle">{m.premium.rear}</text>
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
        <p className="mt-3 text-sm text-muted-foreground">{m.premium.sampleNote}</p>
      </CardContent>
    </Card>
  );
}

export function DamageReport({ i18n: { locale, m }, className }: Section) {
  const words = m.premium;
  const total = [0, 1].map((end) => damage.areas.reduce((sum, area) => sum + area.estimate[end], 0)) as [number, number];
  return (
    <PremiumCard id="damage-report" title={words.damageReport} m={m} className={className}>
      <dl className="grid gap-4 sm:grid-cols-3">
        {[
          [words.primary, words.sample.primary],
          [words.secondary, words.sample.secondary],
          [words.insurerEstimate, usd(locale, damage.insurerEstimate)],
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
            <TableHead scope="col">{words.area}</TableHead>
            <TableHead scope="col">{words.seen}</TableHead>
            <TableHead scope="col">{words.severity}</TableHead>
            <TableHead scope="col">{words.ourEstimate}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {areasIn(m).map((area) => (
            <TableRow key={area.area}>
              <TableCell>{[area.spot, area.area].filter(Boolean).join(" ")}</TableCell>
              <TableCell className="whitespace-normal">{area.seen}</TableCell>
              <TableCell>{area.severity}</TableCell>
              <TableCell>{range(locale, area.estimate, area.openEnded)}</TableCell>
            </TableRow>
          ))}
          <TableRow className="font-semibold">
            <TableCell>{words.total}</TableCell>
            <TableCell className="font-normal text-muted-foreground">{words.usedParts}</TableCell>
            <TableCell />
            <TableCell>{range(locale, total)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <p className="mt-3 text-sm text-muted-foreground">{words.whyLower}</p>
    </PremiumCard>
  );
}

export function Market({ i18n: { locale, m }, className }: Section) {
  const words = m.premium;
  const columns = [
    {
      title: words.value,
      rows: [
        [words.acv, usd(locale, market.acv)],
        [words.cleanRetail, usd(locale, market.cleanRetail)],
        [words.salvageResale, usd(locale, market.salvageResale)],
      ],
    },
    {
      title: words.howItSells,
      rows: [
        [words.demand, words.sample.demand],
        [words.daysToSell, fill(words.days, { days: market.daysToSell })],
        [words.similarSold, String(market.similarSold90Days)],
      ],
    },
  ];
  return (
    <PremiumCard id="market" title={words.market} m={m} className={className}>
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
