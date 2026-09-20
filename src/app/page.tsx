import Link from "next/link";
import { exampleAtCurrentBid, exampleAtMaxBid, exampleInputs, exampleLot } from "@/lib/example-deal";
import { metadataForRoute } from "@/lib/seo/metadata";

export const metadata = metadataForRoute("/", { absoluteTitle: true });

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const percent = new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 1 });

const SECTION = "px-4 sm:px-6 lg:px-10";

/** What the platform answers that an auction site does not. */
const answers = [
  {
    eyebrow: "What is it worth",
    title: "An estimated resale value, not just a bid.",
    body: "Every lot carries a market estimate, so the current bid means something the moment you see it.",
  },
  {
    eyebrow: "What it really costs",
    title: "Fees, transport and repairs, added up.",
    body: "The hammer price is never the price. We total the auction fees, the haul and the reconditioning first.",
  },
  {
    eyebrow: "What to bid",
    title: "A suggested maximum bid you can hold to.",
    body: "Work back from the resale value and the profit you need, and stop bidding where the deal stops working.",
  },
  {
    eyebrow: "Do not miss it",
    title: "Saved searches that tell you when it lists.",
    body: "Save the searches you run every morning and get told when a lot matching them appears.",
  },
  {
    eyebrow: "Why, not just what",
    title: "A plain-English read on every lot, and a score to sort by.",
    body:
      "What looks good, what to check before you bid, and where each number came from — carrying the same confidence rating as the figures it is built on. Analysis, never a promise.",
  },
];

export default function HomePage() {
  return (
    <main>
      <section className={`${SECTION} pt-14 pb-12 sm:pt-20`}>
        <div className="page flex flex-col items-center gap-6 text-center">
          <p className="eyebrow">Copart · IAA · Manheim, in one search</p>
          <h1 className="display max-w-[16ch]">
            Find the lots <span className="mark">worth buying.</span>
          </h1>
          <p className="max-w-[60ch] text-lg text-muted">
            Car&rsquo;s Secrets searches multiple vehicle auctions and shows what a lot is really worth, what it will
            actually cost you, and how much you should bid.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/register" className="btn btn-primary">
              Create your account
            </Link>
            <Link href="/login" className="btn btn-outline">
              Sign in
            </Link>
          </div>
          <p className="hint">No bidding here — every lot links back to the auction that runs it.</p>
        </div>
      </section>

      <section className={SECTION} aria-labelledby="example-heading">
        <div className="page">
          <ExampleDeal />
        </div>
      </section>

      <section className={`${SECTION} py-20 sm:py-28`}>
        <div className="page flex flex-col gap-10">
          <div className="flex flex-col gap-4">
            <h2 className="display text-[clamp(1.875rem,4vw,3rem)]">Answers, not listings.</h2>
            <p className="max-w-[65ch] text-lg text-muted">
              Auction sites already tell you what is for sale. The question a dealer actually has is whether it is
              worth buying, and for how much.
            </p>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {answers.map((answer) => (
              <li key={answer.eyebrow} className="card-sunken flex flex-col gap-2 sm:last:col-span-2">
                <p className="eyebrow">{answer.eyebrow}</p>
                <h3 className="text-xl font-extrabold tracking-tight">{answer.title}</h3>
                <p className="text-muted">{answer.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className={`${SECTION} pb-20 sm:pb-28`}>
        <div className="page flex flex-col items-center gap-6 border-t border-line pt-14 text-center">
          <h2 className="text-2xl font-extrabold tracking-tight">One search. Every auction.</h2>
          <ul className="flex flex-wrap items-center justify-center gap-2">
            {["Copart", "IAA", "Manheim"].map((source) => (
              <li
                key={source}
                className="rounded-[var(--r-pill)] border border-line bg-surface px-4 py-1.5 text-lg font-extrabold tracking-tight shadow-[var(--shadow-sm)]"
              >
                {source}
              </li>
            ))}
          </ul>
          <p className="hint max-w-[50ch]">
            More wholesale and salvage sources are being added. Fields are normalised across every source, so a lot
            reads the same wherever it came from.
          </p>
        </div>
      </section>

      <section className={`${SECTION} bg-ink py-20 text-paper sm:py-24`}>
        <div className="page flex flex-col items-center gap-6 text-center">
          <h2 className="display text-[clamp(1.875rem,4vw,3rem)]">Stop opening twelve tabs.</h2>
          <p className="max-w-[55ch] text-lg opacity-80">
            One search across every auction you buy from, and the numbers that tell you whether to raise your hand.
          </p>
          <Link href="/register" className="btn btn-primary">
            Create your account
          </Link>
        </div>
      </section>
    </main>
  );
}

/**
 * The hero visual: one lot and its deal analysis. Illustrative figures, built
 * by the same analyzeDeal the product uses, and labelled as an example so it
 * is never mistaken for a live listing.
 */
function ExampleDeal() {
  return (
    <figure className="m-0 flex flex-col gap-3">
      <div className="rounded-[var(--r-lg)] border border-line bg-surface p-3 shadow-[var(--shadow-lg)] sm:p-4">
        <div className="grid gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          <LotCard />
          <DealPanel />
        </div>
      </div>
      <figcaption className="hint text-center">
        Illustrative figures for one example lot. Every estimate on Car&rsquo;s Secrets is an estimate, not a
        guarantee.
      </figcaption>
    </figure>
  );
}

function LotCard() {
  return (
    <article className="flex flex-col overflow-hidden rounded-[var(--r-md)] border border-line bg-surface text-left">
      <div className="relative bg-sunken">
        <p className="absolute top-3 left-3 rounded-[var(--r-pill)] bg-ink px-2.5 py-1 text-xs font-bold tracking-wide text-paper uppercase">
          Example
        </p>
        <CarSilhouette />
      </div>
      <div className="flex flex-col gap-3 p-4">
        <div>
          <h3 id="example-heading" className="text-lg font-extrabold tracking-tight">
            {exampleLot.name}
          </h3>
          <p className="hint">
            {exampleLot.source} · {exampleLot.location} · {exampleLot.sale}
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1">
          <dt className="hint">Current bid</dt>
          <dd className="text-right font-bold">{usd.format(exampleInputs.currentBid)}</dd>
          <dt className="hint">Suggested max bid</dt>
          <dd className="text-right font-bold text-brand-red">
            {usd.format(exampleAtCurrentBid.suggestedMaxBid)}
          </dd>
        </dl>
        <ul className="flex flex-wrap gap-1.5">
          {[exampleLot.odometer, exampleLot.damage, exampleLot.titleStatus, ...exampleLot.badges].map((fact) => (
            <li
              key={fact}
              className="rounded-[var(--r-pill)] border border-line px-2.5 py-0.5 text-xs font-semibold text-muted"
            >
              {fact}
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

function DealPanel() {
  const rows = [
    { label: "Auction fees", value: exampleInputs.auctionFees },
    { label: "Transportation", value: exampleInputs.transportEstimate },
    { label: "Estimated repairs", value: exampleInputs.repairEstimate },
  ];
  return (
    <section className="card-sunken flex flex-col gap-4 text-left">
      <div>
        <p className="eyebrow">Deal analysis</p>
        <p className="text-muted">
          If you paid the suggested maximum bid of{" "}
          <strong className="text-ink">{usd.format(exampleAtCurrentBid.suggestedMaxBid)}</strong>:
        </p>
      </div>
      <dl className="flex flex-col gap-1.5">
        <div className="flex justify-between gap-4">
          <dt>Purchase price</dt>
          <dd className="font-semibold tabular-nums">{usd.format(exampleAtCurrentBid.suggestedMaxBid)}</dd>
        </div>
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between gap-4 text-muted">
            <dt>{row.label}</dt>
            <dd className="tabular-nums">{usd.format(row.value)}</dd>
          </div>
        ))}
        <div className="mt-1 flex justify-between gap-4 border-t border-line pt-2">
          <dt className="font-semibold">Estimated total cost</dt>
          <dd className="font-bold tabular-nums">{usd.format(exampleAtMaxBid.totalAcquisitionCost)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="font-semibold">Estimated resale value</dt>
          <dd className="font-bold tabular-nums">{usd.format(exampleInputs.estimatedResaleValue)}</dd>
        </div>
      </dl>
      <div className="flex items-end justify-between gap-4 border-t border-line pt-3">
        <div>
          <p className="eyebrow">Potential profit</p>
          <p className="text-3xl font-extrabold tracking-tight text-positive tabular-nums">
            {usd.format(exampleAtMaxBid.projectedProfit)}
          </p>
        </div>
        <p className="text-xl font-extrabold text-positive tabular-nums">
          {percent.format(exampleAtMaxBid.profitMargin)} margin
        </p>
      </div>
    </section>
  );
}

/** A drawn car, not a photograph: the card illustrates the product, it is not a listing. */
function CarSilhouette() {
  return (
    <svg viewBox="0 0 320 130" role="img" aria-label="Illustration of a car" className="h-auto w-full text-muted">
      <g fill="none" stroke="currentColor" strokeOpacity="0.5" strokeWidth="3" strokeLinecap="round">
        <path
          d="M34 88c-6 0-10-4-10-10v-9c0-6 4-10 10-12l24-6 22-20c5-5 12-7 19-7h56c8 0 15 3 21 8l20 19 30 6c8 2 12 7 12 14v7c0 6-4 10-10 10"
          fill="currentColor"
          fillOpacity="0.09"
        />
        <path d="M84 41l14 21h44V34M142 62h54l-22-21" />
        <circle cx="96" cy="88" r="17" fill="var(--sunken)" />
        <circle cx="228" cy="88" r="17" fill="var(--sunken)" />
        <path d="M113 88h98M24 88h55" />
      </g>
    </svg>
  );
}
