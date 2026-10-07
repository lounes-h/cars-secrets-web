"use server";

import { COUNTED, queryString, readQuery, rememberable } from "@/lib/lot-filters";
import { countLots, type Facets, saveLotPreferences } from "@/lib/lots";
import { sessionToken, visitorIp, visitorZone } from "@/lib/session";

/**
 * How many lots each option of these filters would show, for the filter bar when the dealer
 * opens a list. Counts are a help, not the list: no session or a failure is no counts.
 */
export async function lotCountsAction(search: string, names: string[]): Promise<Facets> {
  const token = await sessionToken();
  const wanted = COUNTED.filter((name) => Array.isArray(names) && names.includes(name));
  if (!token || typeof search !== "string" || !wanted.length) return {};
  try {
    return await countLots(readQuery(new URLSearchParams(search)), wanted, token, await visitorIp(), await visitorZone());
  } catch {
    return {};
  }
}

/** Keeps the dealer's filters and order for their next visit, from any browser. */
export async function rememberLotFiltersAction(search: string): Promise<void> {
  const token = await sessionToken();
  if (!token || typeof search !== "string") return;
  const filters = queryString(rememberable(readQuery(new URLSearchParams(search))));
  try {
    await saveLotPreferences(filters, token, await visitorIp());
  } catch {
    // The list works without it; the next change tries again.
  }
}
