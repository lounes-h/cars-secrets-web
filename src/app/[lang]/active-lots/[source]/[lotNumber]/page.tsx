import {
  CarIcon,
  ClockIcon,
  CogIcon,
  EngineIcon,
  FuelIcon,
  PaletteIcon,
  TagIcon,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyButton } from "@/components/CopyButton";
import { DealCalculator } from "@/components/DealCalculator";
import { GalleryTabs } from "@/components/GalleryTabs";
import { DamageMap, DamageReport, Market, PremiumBadge, PremiumSummary } from "@/components/PremiumSections";
import { LocalTime } from "@/components/LocalTime";
import { LotBadges } from "@/components/LotBadges";
import { LotWatch } from "@/components/LotWatch";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fill, localePath } from "@/lib/i18n";
import { getI18n } from "@/lib/i18n-server";
import { countdown, driveType, engineSpec, odometerStatus, titleType, vehicleType } from "@/lib/lot-signals";
import {
  amount,
  auctionName,
  getLot,
  getLotImages,
  type Lot,
  type LotImage,
  odometer,
  offsiteAddress,
  place,
  saleDate,
  sellerName,
  vehicle,
} from "@/lib/lots";
import { getSavedLot } from "@/lib/saved";
import { buildMetadata } from "@/lib/seo/metadata";
import { currentUser, sessionToken, visitorIp } from "@/lib/session";
import type { Messages } from "@/messages/en";

type Params = Promise<{ source: string; lotNumber: string }>;

/**
 * Titled from the URL rather than the lot: the page is behind sign-in and noindex, so the title
 * is a tab label, and naming the car would cost a second call to the API.
 */
export async function generateMetadata({ params }: { params: Params }) {
  const [{ locale, m }, { source, lotNumber }] = await Promise.all([getI18n(), params]);
  return buildMetadata({
    title: fill(m.lot.number, { number: lotNumber }),
    description: m.lotPage.description,
    path: `/active-lots/${source}/${lotNumber}`,
    locale,
    noindex: true,
  });
}

export default async function LotPage({ params }: { params: Params }) {
  const [i18n, user, token, { source, lotNumber }] = await Promise.all([
    getI18n(),
    currentUser(),
    sessionToken(),
    params,
  ]);
  const { locale, m } = i18n;
  const words = m.lotPage;

  if (!user || !token) {
    return (
      <Shell heading={fill(m.lot.number, { number: lotNumber })}>
        <p className="mt-8">
          <Link href={localePath("/login", locale)} className={buttonVariants()}>
            {words.signIn}
          </Link>
        </p>
      </Shell>
    );
  }

  const clientIp = await visitorIp();
  const [lot, images, saved] = await Promise.all([
    getLot(source, lotNumber, token, clientIp),
    getLotImages(source, lotNumber, token, clientIp),
    // Without it the lot still shows, as not saved.
    getSavedLot({ source, lot_number: lotNumber }, token, clientIp).catch(() => null),
  ]);
  if (!lot) notFound();

  const title = [lot.year, lot.make, lot.model, lot.trim].filter(Boolean).join(" ") || "—";
  const odometerLabel = odometerStatus(lot, m).label;
  const meta = [
    lot.odometer != null && fill(words.odometer, { odometer: odometer(lot.odometer, i18n), status: odometerLabel.toLowerCase() }),
    driveType(lot),
    lot.damage_primary && fill(m.lot.primaryDamage, { damage: lot.damage_primary }),
    lot.damage_primary && fill(m.lot.secondaryDamage, { damage: lot.damage_secondary || m.lot.notApplicable }),
    place(lot) !== "—" && place(lot),
  ].filter(Boolean);
  // The request's clock: how long until the sale, and whether a set reminder's time has passed.
  const now = new Date();
  const left = lot.sale_at ? countdown(lot.sale_at, now, m) : null;
  const money = (value: number | null) => amount(value, lot.currency, locale);
  const buyNow = lot.buy_it_now_price ? money(lot.buy_it_now_price) : null;
  const auction = auctionName(lot.source);
  const offsiteAt = offsiteAddress(lot);

  return (
    <main className="flex-1 px-4 pt-8 pb-16 sm:px-6 lg:px-8">
      {/* 1. Summary */}
      <header>
        <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-3">
          <div className="min-w-0">
            <h1>{title}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-4 font-mono text-sm text-muted-foreground">
              <span className="break-all">
                {fill(m.lot.number, { number: lot.lot_number })} <CopyButton value={lot.lot_number} label={words.copyLotNumber} />
              </span>
              {lot.vin && (
                <span className="break-all">
                  {fill(m.lot.vin, { vin: lot.vin })} <CopyButton value={lot.vin} label={words.copyVin} />
                </span>
              )}
            </p>
          </div>
          <div className="sm:text-right">
            {left && (
              <p
                className="flex items-center gap-1.5 font-semibold data-[tone=bad]:text-bad data-[tone=neutral]:text-muted-foreground data-[tone=warn]:text-warn sm:justify-end"
                data-tone={left.tone}
              >
                <ClockIcon aria-hidden="true" className="size-4" />
                {left.label}
              </p>
            )}
            {/* No sale day yet is what Copart calls a future sale. */}
            <p className="text-sm text-muted-foreground">
              {lot.sale_at ? <LocalTime value={lot.sale_at} format="sale" /> : lot.sale_date ? saleDate(lot.sale_date, locale) : m.lot.futureSale}
            </p>
            <LotWatch
              lot={{ source: lot.source, lot_number: lot.lot_number, sale_at: lot.sale_at }}
              initial={saved && { change_alerts: saved.change_alerts, remind_hour: saved.remind_hour, remind_day: saved.remind_day }}
              full
              now={now.getTime()}
              className="mt-2 sm:items-end"
            />
            {lot.listing_url && (
              <a href={lot.listing_url} rel="noopener noreferrer nofollow" target="_blank" className={buttonVariants({ variant: "outline", size: "lg", className: "mt-2" })}>
                {fill(words.viewOn, { auction })}
              </a>
            )}
            <p className="mt-1 text-sm text-muted-foreground">{fill(words.biddingOn, { auction })}</p>
          </div>
        </div>
        {meta.length > 0 && <p className="mt-3 text-sm text-muted-foreground">{meta.join(" · ")}</p>}
        <LotBadges lot={lot} m={m} className="mt-3" badgeClassName="h-6 px-2.5 text-sm" />
        <PremiumSummary i18n={i18n} className="mt-6" />
      </header>

      <div className="mt-8 grid gap-6 sm:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        {/* 2. Photos, and the damage map beside them */}
        <GalleryTabs
          photos={<Photos lot={lot} images={images} m={m} />}
          damageMap={<DamageMap m={m} />}
        />

        {/* 3. Deal calculator: the one emphasised card on the page. */}
        <section aria-labelledby="deal" className="self-start">
          <Card className="border-foreground">
            <CardHeader className="flex flex-wrap items-center gap-3">
              <PremiumBadge m={m} />
              <CardTitle id="deal">{words.dealCalculator}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">
                {fill(words.likelyFinalBid, {
                  amount: lot.predicted_final_price == null ? words.notAvailable : money(lot.predicted_final_price),
                })}
              </p>
              <DealCalculator />
              <p className="mt-3 text-sm text-muted-foreground">
                {fill(words.figures, { bid: money(lot.high_bid), retail: money(lot.est_retail_value) })}
              </p>
              {lot.listing_url && buyNow && (
                <a href={lot.listing_url} rel="noopener noreferrer nofollow" target="_blank" className={buttonVariants({ variant: "outline", size: "lg", className: "mt-4" })}>
                  {fill(words.buyNow, { amount: buyNow })}
                </a>
              )}
            </CardContent>
          </Card>
        </section>
      </div>

      <DamageReport i18n={i18n} className="mt-8" />
      <Market i18n={i18n} className="mt-6" />

      <div className="mt-8 grid gap-6 sm:grid-cols-3">
        {/* 4. Condition */}
        <Details title={words.condition}>
          <Field label={words.primaryDamage} value={lot.damage_primary} />
          <Field label={words.secondaryDamage} value={lot.damage_secondary} />
          <Field label={words.repairEstimate} value={money(lot.repair_cost)} />
        </Details>
        {/* 5. Paperwork */}
        <Details title={words.paperwork}>
          <Field label={words.title} value={titleType(lot, m).label} />
          <Field label={words.odometerLabel} value={odometer(lot.odometer, i18n)} />
          <Field label={words.odometerStatus} value={odometerLabel} />
        </Details>
        {/* 6. Pickup */}
        <Details title={words.pickup}>
          <Field label={words.yard} value={[lot.yard_name, lot.yard_code && fill(words.yardCode, { code: lot.yard_code })].filter(Boolean).join(", ")} />
          <Field label={words.address} value={[place(lot) !== "—" && place(lot), lot.location_zip, lot.location_country].filter(Boolean).join(" ")} />
          {offsiteAt && <Field label={words.offsiteAddress} value={offsiteAt} />}
        </Details>
      </div>

      {/* 7. Specs */}
      <section aria-labelledby="specs" className="mt-8">
        <h2 id="specs" className="text-sm font-semibold text-muted-foreground">{words.specs}</h2>
        <ul className="mt-2 grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-2">
          {([
            [EngineIcon, words.engine, engineSpec(lot, m)],
            [CogIcon, words.transmission, lot.transmission],
            [FuelIcon, words.fuel, lot.fuel_type],
            [PaletteIcon, words.color, lot.color],
            [CarIcon, words.bodyStyle, lot.body_style],
            [TagIcon, words.vehicleType, vehicleType(lot, m)],
            [TagIcon, words.modelDetail, lot.model_detail],
          ] satisfies [LucideIcon, string, string | null][]).map(([Icon, label, value]) => (
            <li key={label} className="flex items-start gap-2 rounded-lg border p-3">
              <Icon aria-hidden="true" className="size-4 flex-none" />
              <span className="min-w-0">
                <span className="block text-xs text-muted-foreground">{label}</span>
                <span className="block text-sm break-words">{value || "—"}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* 8. Sale info */}
      <section aria-labelledby="sale" className="mt-8">
        <h2 id="sale" className="text-sm font-semibold text-muted-foreground">{words.saleInfo}</h2>
        <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground [&>div]:flex [&>div]:gap-1.5 [&_dd]:text-foreground">
          {([
            [words.auction, auction],
            [words.seller, sellerName(lot)],
            [words.currency, lot.currency],
            [fill(words.updatedOn, { auction }), <LocalTime key="updated" value={lot.source_updated_at} />],
            [words.added, <LocalTime key="added" value={lot.first_seen_at} />],
            [words.lastChange, <LocalTime key="changed" value={lot.last_changed_at} />],
          ] satisfies [string, React.ReactNode][]).map(([label, value]) => (
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
function Photos({ lot, images, m }: { lot: Lot; images: LotImage[]; m: Messages }) {
  const words = m.lotPage;
  const photos = images.filter((image) => image.full ?? image.thumb);
  if (photos.length === 0) return <p className="text-sm text-muted-foreground">{words.noPhotos}</p>;
  const photoId = (index: number) => `photo-${index + 1}`;
  const describe = (index: number) =>
    fill(words.photo, { vehicle: vehicle(lot), number: lot.lot_number, index: index + 1, count: photos.length });
  const tall = "h-[min(50vh,28rem)]";
  return (
    <section aria-label={fill(words.photos, { number: lot.lot_number })} className="min-w-0">
      <div className="flex gap-3">
        {photos.length > 1 && (
          <div className={`${tall} flex w-20 flex-none flex-col gap-2 overflow-y-auto sm:w-24`}>
            {photos.map((photo, index) => (
              <a key={photoId(index)} href={`#${photoId(index)}`} className="flex-none">
                {/* eslint-disable-next-line @next/next/no-img-element -- the auction hosts the photo; next/image would proxy it */}
                <img
                  src={photo.thumb ?? photo.full ?? ""}
                  alt={fill(words.showPhoto, { index: index + 1 })}
                  loading="lazy"
                  className="h-14 w-full rounded-md border object-cover sm:h-16"
                />
              </a>
            ))}
          </div>
        )}
        <div className="flex flex-1 snap-x snap-mandatory overflow-x-auto rounded-xl border bg-foreground">
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
    <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <h1>{heading}</h1>
      {children}
    </main>
  );
}

/** A quiet detail section: small, muted, never collapsed. */
function Details({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="min-w-0">
      <h2 className="text-sm font-semibold text-muted-foreground">{title}</h2>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">{children}</dl>
    </section>
  );
}

function Field({ label, value }: { label: string; value: string | number | null }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="break-words">{value || "—"}</dd>
    </>
  );
}
