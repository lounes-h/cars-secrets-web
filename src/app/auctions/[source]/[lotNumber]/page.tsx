import Link from "next/link";
import { notFound } from "next/navigation";
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
    path: `/auctions/${source}/${lotNumber}`,
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

  return (
    <Shell heading={vehicle(lot)}>
      <p className="mt-3 max-w-[65ch] text-muted">
        Lot {lot.lot_number} at {lot.source}, {place(lot)}, selling {saleTime(lot.sale_at)}. Bidding
        happens on the auction&apos;s own site.
      </p>
      <div className="mt-8 flex flex-wrap items-center gap-4">
        {lot.listing_url && (
          <a href={lot.listing_url} rel="noopener noreferrer nofollow" target="_blank" className="btn btn-primary">
            Bid on {lot.source}
          </a>
        )}
        <Link href="/auctions" className="btn btn-outline">
          Active lots
        </Link>
      </div>
      <Photos lot={lot} images={images} />
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Group title="The car">
          <Field label="VIN" value={lot.vin} />
          <Field label="Year" value={lot.year} />
          <Field label="Make" value={lot.make} />
          <Field label="Model" value={lot.model} />
          <Field label="Model detail" value={lot.model_detail} />
          <Field label="Trim" value={lot.trim} />
          <Field label="Vehicle type" value={lot.vehicle_type} />
          <Field label="Body style" value={lot.body_style} />
          <Field label="Color" value={lot.color} />
          <Field label="Engine" value={lot.engine} />
          <Field label="Cylinders" value={lot.cylinders} />
          <Field label="Fuel" value={lot.fuel_type} />
          <Field label="Transmission" value={lot.transmission} />
          <Field label="Drive" value={lot.drive} />
          <Field label="Odometer" value={odometer(lot.odometer)} />
          <Field label="Odometer brand" value={lot.odometer_brand} />
          <Field label="Runs and drives" value={lot.runs_drives} />
          <Field label="Keys" value={lot.has_keys} />
        </Group>
        <Group title="Damage and title">
          <Field label="Primary damage" value={lot.damage_primary} />
          <Field label="Secondary damage" value={lot.damage_secondary} />
          <Field label="Title type" value={lot.title_type} />
          <Field label="Title state" value={lot.title_state} />
          <Field label="Repair estimate" value={amount(lot.repair_cost, lot.currency)} />
        </Group>
        <Group title="The sale">
          <Field label="Auction" value={lot.source} />
          <Field label="Lot number" value={lot.lot_number} />
          <Field label="Sale status" value={lot.sale_status} />
          <Field label="Sale date" value={saleDate(lot.sale_date)} />
          <Field label="Sale time" value={saleTime(lot.sale_at)} />
          <Field label="Seller" value={lot.seller_name} />
          <Field label="Yard" value={lot.yard_name} />
          <Field label="Yard code" value={lot.yard_code} />
          <Field label="Location" value={place(lot)} />
          <Field label="ZIP code" value={lot.location_zip} />
          <Field label="Country" value={lot.location_country} />
          <Field label="Currency" value={lot.currency} />
          <Field label="Estimated retail value" value={amount(lot.est_retail_value, lot.currency)} />
          <Field label="High bid" value={amount(lot.high_bid, lot.currency)} />
          <Field label="Buy it now" value={amount(lot.buy_it_now_price, lot.currency)} />
          <Field label="Listed by the auction" value={saleTime(lot.source_created_at)} />
          <Field label="Updated by the auction" value={saleTime(lot.source_updated_at)} />
          <Field label="First seen" value={saleTime(lot.first_seen_at)} />
          <Field label="Last changed" value={saleTime(lot.last_changed_at)} />
        </Group>
      </div>
    </Shell>
  );
}

/**
 * The lot's photos as a gallery: one large photo at a time in a scroll-snapping strip, with a
 * small column of thumbnails on its left jumping to each. Scrolling and the jumps are the
 * browser's own, so the page stays a Server Component with no JavaScript of its own.
 */
function Photos({ lot, images }: { lot: Lot; images: LotImage[] }) {
  const photos = images.filter((image) => image.full ?? image.thumb);
  if (photos.length === 0) return null;
  const photoId = (index: number) => `photo-${index + 1}`;
  const describe = (index: number) => `${vehicle(lot)}, lot ${lot.lot_number}, photo ${index + 1} of ${photos.length}`;
  const tall = "h-[min(50vh,28rem)]";
  return (
    <section aria-label={`Photos of lot ${lot.lot_number}`} className="mt-8 w-full lg:w-2/5">
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

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card">
      <h2 className="text-lg font-semibold">{title}</h2>
      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-[0.9375rem]">{children}</dl>
    </section>
  );
}

function Field({ label, value }: { label: string; value: string | number | null }) {
  return (
    <>
      <dt className="text-muted">{label}</dt>
      <dd>{value || "—"}</dd>
    </>
  );
}
