import Link from "next/link";
import { metadataForRoute } from "@/lib/seo/metadata";

export const metadata = metadataForRoute("/");

const SECTION = "px-4 py-20 sm:px-6 lg:px-10";
const H2 = "text-2xl font-semibold tracking-tight text-balance sm:text-3xl";

const TOOLS = [
  {
    title: "Save Your Searches",
    icon: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
    text: [
      "Stop repeating the same searches every time you visit.",
      "Save the searches that matter to you and quickly return to vehicles that match what you’re looking for.",
    ],
    tagline: "Search once. Come back anytime.",
  },
  {
    title: "Get Alerts",
    icon: <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></>,
    text: [
      "Don’t miss new opportunities.",
      "Create alerts for the vehicles and searches you care about and stay informed when relevant lots become available.",
    ],
    tagline: "Spend less time checking auctions manually.",
  },
  {
    title: "Compare Lots Side by Side",
    icon: <path d="m16 3 4 4-4 4M20 7H4m4 14-4-4 4-4m-4 4h16" />,
    text: [
      "Choosing between several vehicles shouldn’t require switching between tabs.",
      "Add lots to your comparison and review the important details side by side so you can quickly understand which vehicle fits your needs best.",
    ],
    tagline: "Compare your options before you bid.",
  },
  {
    title: "Calculate Auction Fees",
    icon: <path d="M12 2v20m5-17H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />,
    text: [
      "The winning bid isn’t always the final cost.",
      "Use the fee calculator to estimate auction fees and get a clearer picture of what a vehicle may actually cost before placing your bid.",
    ],
    tagline: "Know more of the cost upfront.",
  },
];

// An illustration, not data: the fee section says so.
const FEE_EXAMPLE = [
  ["Bid price", "$7,800"],
  ["Auction fees", "+ $1,124"],
  ["Estimated total", "$8,924"],
];

/** A grey line standing in for text in the sketches. */
function Bar({ className = "" }: { className?: string }) {
  return <div className={`h-2.5 rounded-full bg-line ${className}`} />;
}

/** Stands in for a screenshot of the lot list until there is one. */
function SearchSketch() {
  return (
    <div role="img" aria-label="Sketch of the lot search: a search bar, filters and a list of lots" className="card shadow-lg">
      <div className="h-10 rounded border border-line bg-paper" />
      <div className="mt-3 flex gap-2">
        {["w-16", "w-20", "w-14", "w-24"].map((width) => (
          <div key={width} className={`h-7 rounded-full border border-line ${width}`} />
        ))}
      </div>
      {[0, 1, 2].map((row) => (
        <div key={row} className="mt-4 flex items-center gap-4 border-t border-line pt-4">
          <div className="h-16 w-24 flex-none rounded bg-line" />
          <div className="flex-1 space-y-2">
            <Bar className="w-3/4" />
            <Bar className="w-1/2 bg-paper" />
            <Bar className="w-1/3 bg-paper" />
          </div>
          <div className="h-8 w-16 flex-none rounded bg-ink" />
        </div>
      ))}
    </div>
  );
}

/** Stands in for a screenshot of the comparison until there is one. */
function CompareSketch() {
  return (
    <div role="img" aria-label="Sketch of a comparison: three lots side by side" className="card grid grid-cols-3 gap-4 shadow-lg">
      {[0, 1, 2].map((column) => (
        <div key={column} className="space-y-3">
          <div className="h-20 rounded bg-line" />
          {[0, 1, 2, 3].map((row) => (
            <div key={row} className="space-y-1.5 border-t border-line pt-3">
              <Bar className="w-1/2 bg-paper" />
              <Bar className="w-3/4" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="flex-1">
      <section className={`${SECTION} grid items-center gap-12 bg-surface lg:grid-cols-2`}>
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-balance sm:text-5xl">
            <span className="block">Find the Right Vehicle.</span>{" "}
            <span className="block">Make a Better Bid.</span>
          </h1>
          <p className="mt-6 max-w-[65ch] text-lg">
            CarBidInsight brings vehicle auctions together in one place, giving you the tools you need to search,
            compare, and evaluate lots faster.
          </p>
          <p className="mt-4 max-w-[65ch] text-muted">
            Spend less time jumping between auction websites and more time finding the vehicles worth bidding on.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link href="/active-lots" className="btn btn-primary">
              Explore Auctions
            </Link>
            <a href="#one-place" className="btn btn-ghost">
              See how it works <span aria-hidden="true">↓</span>
            </a>
          </div>
        </div>
        <SearchSketch />
      </section>

      <section id="one-place" className={`${SECTION} grid items-center gap-12 lg:grid-cols-2`}>
        <div className="max-w-[65ch] space-y-4">
          <h2 className={H2}>One Place for Your Auction Search</h2>
          <p>
            Buying vehicles through auctions often means searching across multiple websites, keeping track of different
            lots, comparing vehicles manually, and calculating costs along the way.
          </p>
          <p>CarBidInsight makes that process simpler.</p>
          <p>
            Search and manage auction listings from one place, keep track of the vehicles you’re interested in, and use
            built-in tools to help you make more informed decisions before you bid.
          </p>
        </div>
        <ul aria-label="Auctions" className="card space-y-4">
          {["Copart", "IAA", "Manheim"].map((auction) => (
            <li key={auction} className="flex items-center gap-4 border-t border-line pt-4 first:border-0 first:pt-0">
              <span className="w-20 flex-none font-semibold">{auction}</span>
              <div aria-hidden="true" className="flex-1 space-y-2">
                <Bar className="w-2/3" />
                <Bar className="w-1/3 bg-paper" />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className={`${SECTION} bg-surface`}>
        <h2 className={`${H2} text-center`}>Everything You Need to Stay on Top of Auctions</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {TOOLS.map((tool) => (
            <article key={tool.title} className="card space-y-3">
              <h3 className="flex items-center gap-3 text-xl font-semibold">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6 flex-none" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {tool.icon}
                </svg>
                {tool.title}
              </h3>
              {tool.text.map((line) => (
                <p key={line} className="text-muted">
                  {line}
                </p>
              ))}
              <p className="font-semibold">{tool.tagline}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={`${SECTION} grid items-center gap-12 lg:grid-cols-2`}>
        <CompareSketch />
        <div className="max-w-[65ch] space-y-4">
          <h2 className={H2}>Compare lots side by side</h2>
          <p>Important specs, auction details and costs together.</p>
        </div>
      </section>

      <section className={`${SECTION} bg-surface text-center`}>
        <h2 className={H2}>Know what you’re paying before you place your bid</h2>
        <div className="card mx-auto mt-10 w-full max-w-md text-left">
          <p className="hint">Example</p>
          <dl className="mt-3">
            {FEE_EXAMPLE.map(([label, amount], index) => (
              <div
                key={label}
                className={`flex justify-between py-2 ${index === FEE_EXAMPLE.length - 1 ? "mt-2 border-t border-line pt-4 font-semibold" : ""}`}
              >
                <dt>{label}</dt>
                <dd className="tabular-nums">{amount}</dd>
              </div>
            ))}
          </dl>
        </div>
        <Link href="/active-lots" className="btn btn-outline mt-8">
          Try Fee Calculator
        </Link>
      </section>

      <section className={`${SECTION} text-center`}>
        <h2 className={H2}>
          <span className="block">Less Searching.</span> <span className="block">More Deciding.</span>
        </h2>
        <div className="mx-auto mt-6 max-w-[65ch] space-y-4">
          <p>CarBidInsight is built to make vehicle auction research easier.</p>
          <p>
            Instead of managing listings across different websites and tools, you can keep your search organized in one
            place and focus on what matters most: deciding which vehicles are worth your time and money.
          </p>
        </div>
      </section>

      <section className={`${SECTION} bg-surface text-center`}>
        <h2 className={H2}>Start Finding Your Next Vehicle</h2>
        <p className="mx-auto mt-4 max-w-[65ch]">
          Search auction listings, save the ones that matter, compare your options, and understand the costs before you
          bid.
        </p>
        <Link href="/active-lots" className="btn btn-primary mt-8">
          Explore Auctions
        </Link>
        <p className="hint mt-4">No complicated setup. Just a better way to search vehicle auctions.</p>
      </section>
    </main>
  );
}
