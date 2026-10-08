/** What a dealer saved, kept in their account by the API: lots, with what they switched on for each, and searches. */

import { api, ApiError } from "@/lib/api";
import type { Locale } from "@/lib/i18n";
import type { Lot } from "@/lib/lots";

export type LotKey = { source: string; lot_number: string };

/** What a saved lot has switched on; saving alone switches nothing on. */
export type Switches = { change_alerts: boolean; remind_hour: boolean; remind_day: boolean };

/** `available` is false once the auction no longer lists the lot; `lot` is then as it was last seen. */
export type SavedLot = Switches & { lot: Lot; available: boolean; saved_at: string };

export type SavedSearch = { id: string; name: string; query: string; alerts: boolean; created_at: string };
export type SearchInput = { name: string; query: string; alerts: boolean };

/** The dealer's language and zone: the API keeps them for the emails of their first alert. */
export type Context = { locale: Locale; time_zone: string };

/** "copart/41633106": a lot's key in a set of saved lots. */
export const keyOf = (lot: LotKey) => `${lot.source}/${lot.lot_number}`;

const lotUrl = (lot: LotKey) => `/api/me/saved-lots/${encodeURIComponent(lot.source)}/${encodeURIComponent(lot.lot_number)}`;
const searchUrl = (id: string) => `/api/me/saved-searches/${encodeURIComponent(id)}`;

export async function getSavedLots(token: string, clientIp: string | null = null): Promise<SavedLot[]> {
  return (await api<{ items: SavedLot[] }>("/api/me/saved-lots", { token, clientIp })).items;
}

/** Which lots the dealer saved, to mark them in a list. Never an error: the list stands without the marks. */
export async function getSavedLotKeys(token: string, clientIp: string | null = null): Promise<Set<string>> {
  try {
    const { keys } = await api<{ keys: LotKey[] }>("/api/me/saved-lots/keys", { token, clientIp });
    return new Set(keys.map(keyOf));
  } catch {
    return new Set();
  }
}

/** The lot as the dealer saved it, or null when it is not saved. */
export async function getSavedLot(lot: LotKey, token: string, clientIp: string | null = null): Promise<SavedLot | null> {
  try {
    return await api<SavedLot>(lotUrl(lot), { token, clientIp });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

/** Saves the lot unless it is already, and switches what `changes` names. */
export function saveLot(lot: LotKey, changes: Partial<Switches> & Context, token: string, clientIp: string | null = null): Promise<SavedLot> {
  return api<SavedLot>(lotUrl(lot), { method: "PUT", body: changes, token, clientIp });
}

/** Its change alerts and reminders go with it. */
export function unsaveLot(lot: LotKey, token: string, clientIp: string | null = null): Promise<unknown> {
  return api(lotUrl(lot), { method: "DELETE", token, clientIp });
}

export async function getSavedSearches(token: string, clientIp: string | null = null): Promise<SavedSearch[]> {
  return (await api<{ items: SavedSearch[] }>("/api/me/saved-searches", { token, clientIp })).items;
}

export function createSearch(input: SearchInput & Context, token: string, clientIp: string | null = null): Promise<SavedSearch> {
  return api<SavedSearch>("/api/me/saved-searches", { method: "POST", body: input, token, clientIp });
}

/** A new name, new filters, or its alerts paused or resumed. */
export function updateSearch(
  id: string,
  changes: Partial<SearchInput> & Context,
  token: string,
  clientIp: string | null = null,
): Promise<SavedSearch> {
  return api<SavedSearch>(searchUrl(id), { method: "PATCH", body: changes, token, clientIp });
}

/** Its alerts stop; lots saved on their own stay saved. */
export function deleteSearch(id: string, token: string, clientIp: string | null = null): Promise<unknown> {
  return api(searchUrl(id), { method: "DELETE", token, clientIp });
}
