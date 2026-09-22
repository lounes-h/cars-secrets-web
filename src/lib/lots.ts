/** Auction lots, read from the API, which reads the ingest database. */

import { api } from "@/lib/api";

export const PAGE_SIZE = 20;

/** The fields of the API's lot that the listing shows. */
export type Lot = {
  source: string;
  lot_number: string;
  year: number | null;
  make: string | null;
  model: string | null;
  odometer: number | null;
  damage_primary: string | null;
  title_type: string | null;
  est_retail_value: number | null;
  high_bid: number | null;
  currency: string | null;
  sale_at: string | null;
  location_city: string | null;
  location_state: string | null;
  listing_url: string | null;
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
