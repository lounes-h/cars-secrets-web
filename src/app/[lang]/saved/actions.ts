"use server";

import { ApiError } from "@/lib/api";
import type { I18n } from "@/lib/i18n";
import { actionI18n } from "@/lib/i18n-server";
import { knownZone, readQuery, SEARCH_NAME_MAX, searchQuery } from "@/lib/lot-filters";
import {
  createSearch,
  deleteSearch,
  type LotKey,
  saveLot,
  type SavedLot,
  type SavedSearch,
  type SearchInput,
  type Switches,
  unsaveLot,
  updateSearch,
} from "@/lib/saved";
import { sessionToken, visitorIp, visitorZone } from "@/lib/session";

/** An action's answer to the control that called it: what is now saved, or why not, in the page's words. */
export type Result<T> = { value: T } | { error: string };

const SWITCHES = ["change_alerts", "remind_hour", "remind_day"] as const;
const SEARCH_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A lot as the API's routes name it; anything else is null. */
function lotKey(value: unknown): LotKey | null {
  const { source, lot_number } = (value ?? {}) as Record<string, unknown>;
  const part = (text: unknown): text is string => typeof text === "string" && text.length > 0 && text.length <= 40;
  return part(source) && part(lot_number) ? { source, lot_number } : null;
}

/** Only the switches named, each on or off. */
function switches(changes: unknown): Partial<Switches> {
  const given = (changes ?? {}) as Record<string, unknown>;
  return Object.fromEntries(SWITCHES.filter((name) => typeof given[name] === "boolean").map((name) => [name, given[name]]));
}

/**
 * A search's name, trimmed, its filters and words as the list reads them (no order), and its alerts.
 * `partial` takes only what is given, for a change; null when something given is not valid.
 */
function search(input: unknown, partial: boolean): Partial<SearchInput> | null {
  const { name, query, alerts } = (input ?? {}) as Record<string, unknown>;
  const found: Partial<SearchInput> = {};
  if (!partial || name !== undefined) {
    const trimmed = typeof name === "string" ? name.trim() : "";
    if (!trimmed || trimmed.length > SEARCH_NAME_MAX) return null;
    found.name = trimmed;
  }
  if (!partial || query !== undefined) {
    if (typeof query !== "string") return null;
    found.query = searchQuery(readQuery(new URLSearchParams(query)));
  }
  if (!partial || alerts !== undefined) {
    if (typeof alerts !== "boolean") return null;
    found.alerts = alerts;
  }
  return found;
}

/** Who asks, in which language, and the zone their first alert's emails will use: the browser's, else the one the list kept. */
async function caller(zone: unknown) {
  const [token, i18n, ip, kept] = await Promise.all([sessionToken(), actionI18n(), visitorIp(), visitorZone()]);
  const time_zone = knownZone(typeof zone === "string" ? zone : null) ?? kept ?? "UTC";
  return { token, i18n, ip, context: { locale: i18n.locale, time_zone } };
}

/** The API's refusal in the page's words. */
function refusal(error: unknown, { m }: I18n, limit: "lots" | "searches"): { error: string } {
  const code = error instanceof ApiError ? error.code : null;
  if (code === "limit_reached") return { error: m.saved.errors[limit] };
  return { error: code === "lot_not_found" ? m.saved.errors.gone : m.saved.errors.failed };
}

/** Saves a lot unless it is already, and switches its change alerts and reminders as `changes` says. */
export async function saveLotAction(lot: LotKey, changes: Partial<Switches>, zone?: string): Promise<Result<SavedLot>> {
  const { token, i18n, ip, context } = await caller(zone);
  const key = lotKey(lot);
  if (!token || !key) return { error: i18n.m.saved.errors.failed };
  try {
    return { value: await saveLot(key, { ...switches(changes), ...context }, token, ip) };
  } catch (error) {
    return refusal(error, i18n, "lots");
  }
}

/** Removes a saved lot, with its change alerts and reminders. */
export async function unsaveLotAction(lot: LotKey): Promise<Result<null>> {
  const { token, i18n, ip } = await caller(null);
  const key = lotKey(lot);
  if (!token || !key) return { error: i18n.m.saved.errors.failed };
  try {
    await unsaveLot(key, token, ip);
    return { value: null };
  } catch (error) {
    return refusal(error, i18n, "lots");
  }
}

export async function saveSearchAction(input: SearchInput, zone?: string): Promise<Result<SavedSearch>> {
  const { token, i18n, ip, context } = await caller(zone);
  const found = search(input, false) as SearchInput | null;
  if (!token || !found) return { error: i18n.m.saved.errors.failed };
  try {
    return { value: await createSearch({ ...found, ...context }, token, ip) };
  } catch (error) {
    return refusal(error, i18n, "searches");
  }
}

/** Renames a search, gives it new filters, or pauses or resumes its alerts. */
export async function updateSearchAction(id: string, changes: Partial<SearchInput>, zone?: string): Promise<Result<SavedSearch>> {
  const { token, i18n, ip, context } = await caller(zone);
  const found = search(changes, true);
  if (!token || !found || typeof id !== "string" || !SEARCH_ID.test(id)) return { error: i18n.m.saved.errors.failed };
  try {
    return { value: await updateSearch(id, { ...found, ...context }, token, ip) };
  } catch (error) {
    return refusal(error, i18n, "searches");
  }
}

/** Deletes a search: its alerts stop, lots saved on their own stay. */
export async function deleteSearchAction(id: string): Promise<Result<null>> {
  const { token, i18n, ip } = await caller(null);
  if (!token || typeof id !== "string" || !SEARCH_ID.test(id)) return { error: i18n.m.saved.errors.failed };
  try {
    await deleteSearch(id, token, ip);
    return { value: null };
  } catch (error) {
    return refusal(error, i18n, "searches");
  }
}
