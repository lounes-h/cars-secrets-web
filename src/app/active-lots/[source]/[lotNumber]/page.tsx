import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyButton } from "@/components/CopyButton";
import { badges, countdown, engineSpec, odometerStatus, saleStatus, titleType } from "@/lib/lot-signals";
import {
  amount,
  getLot,
  getLotImages,
  type Lot,
  type LotImage,
  odometer,
  place,
  saleDate,
  saleTime,
  vehicle,
} from "@/lib/lots";
import { buildMetadata } from "@/lib/seo/metadata";
import { currentUser, sessionToken, visitorIp } from "@/lib/session";

type Params = Promise<{ source: string; lotNumber: string }>;

/**
 * Titled from the URL rather than the lot: the page is behind sign-in and noindex, so the title
 * is a tab label, and naming the car would cost a second call to the API.
 */
export async function generateMetadata({ params }: { params: Params }) {
  const { source, lotNumber } = await params;
  return buildMetadata({
    title: `Lot ${lotNumber}`,
    description:
      "Everything the auction publishes about this lot: the car, its damage, title, odometer, where it sells and what it is bid up to.",
    path: `/active-lots/${source}/${lotNumber}`,
    noindex: true,
  });
}

export default async function LotPage({ params }: { params: Params }) {
  const [user, token, { source, lotNumber }] = await Promise.all([
    currentUser(),
    sessionToken(),
    params,
  ]);

  if (!user || !token) {
    return (
      <Shell heading={`Lot ${lotNumber}`}>
        <p className="mt-8">
          <Link href="/login" className="btn btn-primary">
            Sign in to see this lot
          </Link>
        </p>
      </Shell>
    );
  }

  const clientIp = await visitorIp();
  const [lot, images] = await Promise.all([
    getLot(source, lotNumber, token, clientIp),
    getLotImages(source, lotNumber, token, clientIp),
  ]);
  if (!lot) notFound();

  const title = [lot.year, lot.make, lot.model, lot.trim].filter(Boolean).join(" ") || "—";
  const odometerLabel = odometerStatus(lot).label;
  const meta = [
    lot.odometer != null && `${odometer(lot.odometer)} (${odometerLabel.toLowerCase()})`,
    lot.damage_primary && `#1 ${lot.damage_primary}`,
    lot.damage_secondary && `#2 ${lot.damage_secondary}`,
    place(lot) !== "—" && place(lot),
  ].filter(Boolean);
  const left = lot.sale_at ? countdown(lot.sale_at, new Date()) : null;
  const buyNow = lot.buy_it_now_price ? amount(lot.buy_it_now_price, lot.currency) : null;

  return (
    <main className="flex-1 bg-white px-4 py-8 sm:px-6 lg:px-10">
      {/* 1. Summary */}
      <header>
        <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-3">
          <div className="min-w-0">
            <h1>{title}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-4 font-mono text-sm text-muted">
              <span className="break-all">
                Lot {lot.lot_number} <CopyButton value={lot.lot_number} label="lot number" />
              </span>
              {lot.vin && (
                <span className="break-all">
                  VIN {lot.vin} <CopyButton value={lot.vin} label="VIN" />
                </span>
              )}
            </p>
          </div>
          <div className="sm:text-right">
            {left && (
              <p className={`flex items-center gap-1.5 font-semibold sm:justify-end ${left.tone === "neutral" ? "text-muted" : ""}`} data-tone={left.tone}>
                <Icon name="clock" />
                {left.label}
              </p>
            )}
            <p className="text-sm text-muted">{lot.sale_at ? saleMoment(lot.sale_at) : saleDate(lot.sale_date)}</p>
          </div>
        </div>
        {meta.length > 0 && <p className="mt-3 text-sm text-muted">{meta.join(" · ")}</p>}
        <ul aria-label="Deal breakers" className="mt-3 flex flex-wrap gap-2">
          {badges(lot).map((badge) => (
            <li key={badge.label} className="badge" data-tone={badge.tone}>
              <span aria-hidden="true">{TONE_ICONS[badge.tone]}</span>
              {badge.label}
            </li>
          ))}
        </ul>
      </header>

      <div className="mt-8 grid gap-6 sm:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        {/* 2. Photos */}
        <Photos lot={lot} images={images} />

        {/* 3. All-in cost: the one emphasised card on the page. */}
        <section aria-labelledby="cost" className="card self-start border-2 border-ink">
          <h2 id="cost" className="text-lg font-semibold">All-in cost</h2>
          <dl className="mt-3 grid grid-cols-[1fr_auto] gap-x-6 gap-y-2">
            <Field label="Current bid" value={amount(lot.high_bid, lot.currency)} />
            <Field label="Buyer and gate fees (est.)" value="Not estimated yet" />
            <Field label="Shipping to you (est.)" value="Not estimated yet" />
            <dt className="border-t border-line pt-2 font-semibold">Total</dt>
            <dd className="border-t border-line pt-2 text-right font-semibold">—</dd>
          </dl>
          <p className="hint mt-2">The total needs the auction&apos;s fees and a shipping estimate, which are not in yet.</p>
          <p className="mt-3 text-sm text-muted">
            Retail value (ACV) {amount(lot.est_retail_value, lot.currency)}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {lot.listing_url && (
              <a href={lot.listing_url} rel="noopener noreferrer nofollow" target="_blank" className="btn btn-primary">
                Place bid
              </a>
            )}
            {lot.listing_url && buyNow && (
              <a href={lot.listing_url} rel="noopener noreferrer nofollow" target="_blank" className="btn btn-outline">
                Buy now {buyNow}
              </a>
            )}
          </div>
          <p className="hint mt-3">
            Bidding happens on {lot.source}&apos;s own site. <Link href="/active-lots">Active lots</Link>
          </p>
        </section>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-3">
        {/* 4. Condition */}
        <Details title="Condition">
          <Field label="Primary damage" value={lot.damage_primary} />
          <Field label="Secondary damage" value={lot.damage_secondary} />
          <Field label="Repair estimate" value={amount(lot.repair_cost, lot.currency)} />
        </Details>
        {/* 5. Paperwork */}
        <Details title="Paperwork">
          <Field label="Title" value={titleType(lot).label} />
          <Field label="Odometer" value={odometer(lot.odometer)} />
          <Field label="Odometer status" value={odometerLabel} />
        </Details>
        {/* 6. Pickup */}
        <Details title="Pickup">
          <Field label="Yard" value={[lot.yard_name, lot.yard_code && `yard ${lot.yard_code}`].filter(Boolean).join(", ")} />
          <Field label="Address" value={[place(lot) !== "—" && place(lot), lot.location_zip, lot.location_country].filter(Boolean).join(" ")} />
        </Details>
      </div>

      {/* 7. Specs */}
      <section aria-labelledby="specs" className="mt-8">
        <h2 id="specs" className="text-sm font-semibold text-muted">Specs</h2>
        <ul className="mt-2 grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-2">
          {[
            ["engine", "Engine", engineSpec(lot)],
            ["transmission", "Transmission", lot.transmission],
            ["drive", "Drive", lot.drive],
            ["fuel", "Fuel", lot.fuel_type],
            ["color", "Color", lot.color],
            ["body", "Body style", lot.body_style],
            ["tag", "Vehicle type", lot.vehicle_type],
            ["tag", "Model detail", lot.model_detail],
          ].map(([icon, label, value]) => (
            <li key={label} className="flex items-start gap-2 rounded border border-line p-2">
              <Icon name={icon as IconName} />
              <span className="min-w-0">
                <span className="block text-xs text-muted">{label}</span>
                <span className="block text-sm break-words">{value || "—"}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* 8. Sale info */}
      <section aria-labelledby="sale" className="mt-8">
        <h2 id="sale" className="text-sm font-semibold text-muted">Sale info</h2>
        <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted [&>div]:flex [&>div]:gap-1.5 [&_dd]:text-ink">
          {[
            ["Auction", lot.source],
            ["Seller", lot.seller_name],
            ["Sale status", saleStatus(lot).label],
            ["Currency", lot.currency],
            ["Listed by the auction", saleTime(lot.source_created_at)],
            ["Last updated", saleTime(lot.source_updated_at)],
            ["First seen", saleTime(lot.first_seen_at)],
            ["Last changed", saleTime(lot.last_changed_at)],
          ].map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value || "—"}</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}

/**
 * The lot's photos as a gallery: one large photo at a time in a scroll-snapping strip, with a
 * small column of thumbnails beside it jumping to each. Scrolling and the jumps are the
 * browser's own, so the page stays a Server Component with no JavaScript of its own.
 */
function Photos({ lot, images }: { lot: Lot; images: LotImage[] }) {
  const photos = images.filter((image) => image.full ?? image.thumb);
  if (photos.length === 0) return <p className="hint">The auction has published no photos of this lot.</p>;
  const photoId = (index: number) => `photo-${index + 1}`;
  const describe = (index: number) => `${vehicle(lot)}, lot ${lot.lot_number}, photo ${index + 1} of ${photos.length}`;
  const tall = "h-[min(50vh,28rem)]";
  return (
    <section aria-label={`Photos of lot ${lot.lot_number}`} className="min-w-0">
      <div className="flex gap-3">
        {photos.length > 1 && (
          <div className={`${tall} flex w-20 flex-none flex-col gap-2 overflow-y-auto sm:w-24`}>
            {photos.map((photo, index) => (
              <a key={photoId(index)} href={`#${photoId(index)}`} className="flex-none">
                {/* eslint-disable-next-line @next/next/no-img-element -- the auction hosts the photo; next/image would proxy it */}
                <img
                  src={photo.thumb ?? photo.full ?? ""}
                  alt={`Show photo ${index + 1}`}
                  loading="lazy"
                  className="h-14 w-full rounded border border-line object-cover sm:h-16"
                />
              </a>
            ))}
          </div>
        )}
        <div className="flex flex-1 snap-x snap-mandatory overflow-x-auto rounded border border-line bg-ink">
          {photos.map((photo, index) => (
            // eslint-disable-next-line @next/next/no-img-element -- as above
            <img
              key={photoId(index)}
              id={photoId(index)}
              src={photo.full ?? photo.thumb ?? ""}
              alt={describe(index)}
              loading={index === 0 ? undefined : "lazy"}
              // scroll-mt keeps the heading in view when a thumbnail jumps the page to a photo.
              className={`${tall} w-full flex-none scroll-mt-6 snap-center object-contain`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function Shell({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <main className="flex-1 bg-white px-4 py-10 sm:px-6 lg:px-10">
      <h1>{heading}</h1>
      {children}
    </main>
  );
}

/** A quiet detail section: small, muted, never collapsed. */
function Details({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="min-w-0">
      <h2 className="text-sm font-semibold text-muted">{title}</h2>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">{children}</dl>
    </section>
  );
}

function Field({ label, value }: { label: string; value: string | number | null }) {
  return (
    <>
      <dt className="text-muted">{label}</dt>
      <dd className="break-words">{value || "—"}</dd>
    </>
  );
}

const TONE_ICONS = { good: "✓", warn: "!", bad: "✕", neutral: "•" } as const;

/** Sale times are the auction's own, in UTC like every other time on the site: "Thu, Sep 24, 10:00 AM". */
const moment = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
});
const saleMoment = (value: string) => moment.format(new Date(value));

const ICONS = {
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  engine: <><circle cx="12" cy="12" r="3" /><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" /></>,
  transmission: <path d="M6 4v16M12 4v16M18 4v8M6 12h12" />,
  drive: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="2" /></>,
  fuel: <path d="M12 3c3 4 6 7 6 11a6 6 0 0 1-12 0c0-4 3-7 6-11z" />,
  color: <><circle cx="12" cy="12" r="9" /><path d="M12 3v18" /></>,
  body: <path d="M3 16v-3l2-5h14l2 5v3zM7 16v2M17 16v2" />,
  tag: <><path d="M3 12V3h9l9 9-9 9z" /><circle cx="7.5" cy="7.5" r="1" /></>,
};
type IconName = keyof typeof ICONS;

function Icon({ name }: { name: IconName }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4 flex-none" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {ICONS[name]}
    </svg>
  );
}
