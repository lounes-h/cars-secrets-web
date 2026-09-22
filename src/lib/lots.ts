/** Auction lots, read from the API, which reads the ingest database. */

import { api, ApiError } from "@/lib/api";

export const PAGE_SIZE = 20;

/** A lot as the API returns it: the ingest's canonical columns, plus where to bid. */
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
  sale_at: string | null;
  yard_name: string | null;
  location_city: string | null;
  location_state: string | null;
  thumbnail_url: string | null;
  /** The auction's photo listing endpoint, not an image: never use it as an <img> source. */
  image_url: string | null;
  listing_url: string | null;
  first_seen_at: string;
  last_changed_at: string;
};

export type LotPage = { items: Lot[]; total: number };

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

export function odometer(value: number | null): string {
  return value == null ? "—" : `${miles.format(value)} mi`;
}

export function saleTime(value: string | null): string {
  return value ? when.format(new Date(value)) : "—";
}

export function vehicle(lot: Lot): string {
  return [lot.year, lot.make, lot.model].filter(Boolean).join(" ") || "—";
}

export function place(lot: Lot): string {
  return [lot.location_city, lot.location_state].filter(Boolean).join(", ") || "—";
}

/** Where this lot's page lives. */
export function lotPath(lot: Pick<Lot, "source" | "lot_number">): string {
  return `/auctions/${encodeURIComponent(lot.source)}/${encodeURIComponent(lot.lot_number)}`;
}
