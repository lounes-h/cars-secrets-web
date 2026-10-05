/** Auction lots, read from the API, which reads the ingest database. */

import { api, ApiError } from "@/lib/api";
import { type Query, queryString } from "@/lib/lot-filters";

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
  /** The ingest model's estimate, null until the lot has been priced. */
  predicted_final_price: number | null;
  buy_it_now_price: number | null;
  currency: string | null;
  sale_status: string | null;
  /** The auction's sale day, without a time: formatted by `saleDate`, not `LocalTime`. */
  sale_date: string | null;
  sale_at: string | null;
  yard_code: string | null;
  yard_name: string | null;
  seller_name: string | null;
  location_city: string | null;
  location_state: string | null;
  location_zip: string | null;
  location_country: string | null;
  /** Where the lot is held when it is not at the yard; all null for most lots. */
  offsite_address: string | null;
  offsite_city: string | null;
  offsite_state: string | null;
  offsite_zip: string | null;
  thumbnail_url: string | null;
  /** The auction's photo listing endpoint, not an image: never use it as an <img> source. */
  image_url: string | null;
  /** Copart's "Create Date/Time": when the export was made, the same on every row and without a zone. Not a lot date, so never shown. */
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

/** The query as the API takes it: the same parameters, plus the zone that says when "today" is. */
function apiQuery(query: Query, zone: string | null): string {
  return queryString(zone ? { ...query, tz: [zone] } : query);
}

export function listLots(
  query: Query,
  page: number,
  token: string,
  clientIp: string | null = null,
  zone: string | null = null,
): Promise<LotPage> {
  const offset = (page - 1) * PAGE_SIZE;
  const search = [apiQuery(query, zone), `limit=${PAGE_SIZE}`, `offset=${offset}`].filter(Boolean).join("&");
  return api<LotPage>(`/api/lots?${search}`, { token, clientIp });
}

export type Facets = Record<string, { value: string; count: number }[]>;

/** How many lots each option of these filters would show, given the query's other filters. */
export async function countLots(
  query: Query,
  names: string[],
  token: string,
  clientIp: string | null = null,
  zone: string | null = null,
): Promise<Facets> {
  const search = queryString({ ...query, ...(zone ? { tz: [zone] } : {}), facets: names });
  return (await api<{ facets: Facets }>(`/api/lots/counts?${search}`, { token, clientIp })).facets;
}

/** Lots counted over the windows the API knows, each starting at midnight in the dealer's zone. */
export type ActivityCounts = { today: number; last_3_days: number; last_7_days: number };

/** How many lots were added lately, and how many seen before changed (a new lot is not also "updated"). */
export type LotActivity = { added: ActivityCounts; updated: ActivityCounts };

export function getLotActivity(token: string, clientIp: string | null = null, zone: string | null = null): Promise<LotActivity> {
  const search = zone ? `?${new URLSearchParams({ tz: zone })}` : "";
  return api<LotActivity>(`/api/lots/activity${search}`, { token, clientIp });
}

/** Fewer lots than this today reads as a quiet day, so the summary looks further back. */
export const ACTIVITY_MIN = 1000;
const ACTIVITY_WINDOWS = [
  ["today", "today"],
  ["last_3_days", "in the last 3 days"],
  ["last_7_days", "in the last 7 days"],
] as const;

/** The shortest window with at least ACTIVITY_MIN lots, or else the last 7 days, and its words. */
export function activityWindow(counts: ActivityCounts): { count: number; words: string } {
  const [key, words] = ACTIVITY_WINDOWS.find(([key]) => counts[key] >= ACTIVITY_MIN) ?? ACTIVITY_WINDOWS[2];
  return { count: counts[key], words };
}

/** What a search names: the one lot of a lot number or VIN, or a make, model and years. */
export type Interpretation = {
  lot: { source: string; lot_number: string } | null;
  make: string | null;
  model: string | null;
  year_min: number | null;
  year_max: number | null;
  /** The words left over, still searched as keywords. */
  q: string;
};

export function interpretSearch(q: string, token: string, clientIp: string | null = null): Promise<Interpretation> {
  return api<Interpretation>(`/api/lots/interpret?${new URLSearchParams({ q })}`, { token, clientIp });
}

/** The lot list as the dealer last left it (a query string), and how often they set each filter. */
export type LotPreferences = { filters: string; usage: Record<string, number> };

/** Never an error: without them the list simply starts from no filters. */
export async function getLotPreferences(token: string, clientIp: string | null = null): Promise<LotPreferences> {
  try {
    return await api<LotPreferences>("/api/me/lot-preferences", { token, clientIp });
  } catch {
    return { filters: "", usage: {} };
  }
}

export function saveLotPreferences(filters: string, token: string, clientIp: string | null = null): Promise<LotPreferences> {
  return api<LotPreferences>("/api/me/lot-preferences", { method: "PUT", body: { filters }, token, clientIp });
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
/** A calendar day, not a moment: UTC keeps it the same day in every zone. */
const day = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" });

export function odometer(value: number | null): string {
  return value == null ? "—" : `${miles.format(value)} mi`;
}

/** A date column ("2026-10-01"), which carries no time to show. */
export function saleDate(value: string | null): string {
  return value ? day.format(new Date(`${value}T00:00:00Z`)) : "—";
}

export { auctionName } from "@/lib/lot-words";

export function vehicle(lot: Lot): string {
  return [lot.year, lot.make, lot.model].filter(Boolean).join(" ") || "—";
}

export function place(lot: Lot): string {
  return [lot.location_city, lot.location_state].filter(Boolean).join(", ") || "—";
}

/** Where a lot held away from the auction's yard is picked up: "645 W UNION ST, ALLENTOWN, PA 18101". Null at the yard. */
export function offsiteAddress(lot: Lot): string | null {
  const town = [[lot.offsite_city, lot.offsite_state].filter(Boolean).join(", "), lot.offsite_zip].filter(Boolean).join(" ");
  return [lot.offsite_address, town].filter(Boolean).join(", ") || null;
}

/** Copart names some sellers by their logo's file: "ENTERPRISE-LOGO.jpeg" is "ENTERPRISE". */
export function sellerName(lot: Lot): string | null {
  return lot.seller_name?.replace(/-LOGO\.\w+$/i, "").trim() || null;
}

/** Where this lot's page lives. */
export function lotPath(lot: Pick<Lot, "source" | "lot_number">): string {
  return `/active-lots/${encodeURIComponent(lot.source)}/${encodeURIComponent(lot.lot_number)}`;
}
