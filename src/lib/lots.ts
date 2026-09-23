/** Auction lots, read from the API, which reads the ingest database. */

import { api, ApiError } from "@/lib/api";

export const PAGE_SIZE = 20;

/** A lot as the API returns it: every canonical column of the ingest, plus where to bid. */
export type Lot = {
  source: string;
  lot_number: string;
  year: number | null;
  make: string | null;
  model: string | null;
  model_detail: string | null;
  trim: string | null;
  vin: string | null;
  body_style: string | null;
  color: string | null;
  vehicle_type: string | null;
  engine: string | null;
  cylinders: string | null;
  fuel_type: string | null;
  transmission: string | null;
  drive: string | null;
  damage_primary: string | null;
  damage_secondary: string | null;
  title_type: string | null;
  title_state: string | null;
  has_keys: string | null;
  odometer: number | null;
  odometer_brand: string | null;
  runs_drives: string | null;
  est_retail_value: number | null;
  repair_cost: number | null;
  high_bid: number | null;
  buy_it_now_price: number | null;
  currency: string | null;
  sale_status: string | null;
  /** The auction's sale day, without a time: formatted by `saleDate`, not `saleTime`. */
  sale_date: string | null;
  sale_at: string | null;
  yard_code: string | null;
  yard_name: string | null;
  seller_name: string | null;
  location_city: string | null;
  location_state: string | null;
  location_zip: string | null;
  location_country: string | null;
  thumbnail_url: string | null;
  /** The auction's photo listing endpoint, not an image: never use it as an <img> source. */
  image_url: string | null;
  source_created_at: string | null;
  source_updated_at: string | null;
  listing_url: string | null;
  first_seen_at: string;
  last_changed_at: string;
};

export type LotPage = { items: Lot[]; total: number };

/** One photo of a lot, in the sizes the auction publishes for it. */
export type LotImage = { thumb: string | null; full: string | null };

/** Pages are 1-based; anything that is not a whole number above 1 is the first page. */
export function pageNumber(value: unknown): number {
  const page = Number(value);
  return Number.isInteger(page) && page > 1 ? page : 1;
}

export function pageCount(total: number): number {
  return Math.max(1, Math.ceil(total / PAGE_SIZE));
}

export function listLots(page: number, token: string, clientIp: string | null = null): Promise<LotPage> {
  const offset = (page - 1) * PAGE_SIZE;
  return api<LotPage>(`/api/lots?limit=${PAGE_SIZE}&offset=${offset}`, { token, clientIp });
}

/** One lot, or null when the auction no longer lists it. */
export async function getLot(
  source: string,
  lotNumber: string,
  token: string,
  clientIp: string | null = null,
): Promise<Lot | null> {
  const path = `/api/lots/${encodeURIComponent(source)}/${encodeURIComponent(lotNumber)}`;
  try {
    return await api<Lot>(path, { token, clientIp });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

/**
 * Every photo of a lot. The auction is asked by the API, which may fail to reach it, so an
 * empty list means "no photos to show", never an error.
 */
export async function getLotImages(
  source: string,
  lotNumber: string,
  token: string,
  clientIp: string | null = null,
): Promise<LotImage[]> {
  const path = `/api/lots/${encodeURIComponent(source)}/${encodeURIComponent(lotNumber)}/images`;
  try {
    const { images } = await api<{ images: LotImage[] }>(path, { token, clientIp });
    return images;
  } catch {
    return [];
  }
}

/** The lot's own currency, ignored unless it is a currency code Intl accepts. */
export function amount(value: number | null, currency: string | null): string {
  if (value == null) return "—";
  const code = currency && /^[A-Z]{3}$/.test(currency) ? currency : "USD";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: code,
    maximumFractionDigits: 0,
  }).format(value);
}

const miles = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
/** Sale times are the auction's own; UTC keeps server and browser rendering the same string. */
const when = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });
const day = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" });

export function odometer(value: number | null): string {
  return value == null ? "—" : `${miles.format(value)} mi`;
}

/**
 * The auction's own timestamps carry a zone; `source_created_at` does not, and a naive string
 * would otherwise be read in the reader's zone and render differently on server and browser.
 */
export function saleTime(value: string | null): string {
  if (!value) return "—";
  return when.format(new Date(/(Z|[+-]\d\d:?\d\d)$/.test(value) ? value : `${value}Z`));
}

/**
 * Copart's odometer brand, spelled out as its own site spells it: the export carries the
 * one-letter code ("A", "N", "E"), which says nothing to a dealer. An unknown code is shown
 * as it came, rather than guessed at.
 * ponytail: one map, since Copart is the only source; key it by source when a second arrives.
 */
const ODOMETER_BRANDS: Record<string, string> = {
  A: "ACTUAL",
  N: "NOT ACTUAL",
  E: "EXEMPT",
};

export function odometerBrand(value: string | null): string {
  if (!value) return "—";
  const code = value.trim().toUpperCase();
  return ODOMETER_BRANDS[code] ?? value;
}

/** A date column ("2026-10-01"), which carries no time to show. */
export function saleDate(value: string | null): string {
  return value ? day.format(new Date(`${value}T00:00:00Z`)) : "—";
}

export function vehicle(lot: Lot): string {
  return [lot.year, lot.make, lot.model].filter(Boolean).join(" ") || "—";
}

export function place(lot: Lot): string {
  return [lot.location_city, lot.location_state].filter(Boolean).join(", ") || "—";
}

/** Where this lot's page lives. */
export function lotPath(lot: Pick<Lot, "source" | "lot_number">): string {
  return `/active-lots/${encodeURIComponent(lot.source)}/${encodeURIComponent(lot.lot_number)}`;
}
