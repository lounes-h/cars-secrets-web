/** A dealer's alerts (their inbox) and alert settings, from the API, which finds and sends the alerts. */

import { api } from "@/lib/api";
import type { Locale } from "@/lib/i18n";
import type { Lot } from "@/lib/lots";

export const ALERT_KINDS = ["matches", "changes", "reminder"] as const;
export type AlertKind = (typeof ALERT_KINDS)[number];
export const isAlertKind = (value: unknown): value is AlertKind => ALERT_KINDS.some((kind) => kind === value);

/** What an alert keeps of a lot: enough to show it after the auction has dropped the lot. */
export type LotSummary = Pick<
  Lot,
  | "source"
  | "lot_number"
  | "year"
  | "make"
  | "model"
  | "trim"
  | "sale_at"
  | "sale_date"
  | "location_city"
  | "location_state"
  | "thumbnail_url"
  | "high_bid"
  | "buy_it_now_price"
  | "currency"
  | "odometer"
  | "damage_primary"
>;

/** When an auction is: a moment, a day without a time, or neither (a future sale). */
export type SaleTime = { at: string | null; date: string | null };

/** What changed on a saved lot since the dealer was last told; `relisted` is a lot whose auction ended, listed again for this one. */
export type LotChanges = {
  relisted?: SaleTime;
  sale?: { from: SaleTime; to: SaleTime };
  buy_now?: { from: number | null; to: number | null };
};

export type SearchMatches = { id: string; name: string; query: string; total: number; lots: (LotSummary & { searches: string[] })[] };

/** One inbox entry: one section of an email, whether or not it was emailed. */
export type Alert = { id: number; created_at: string; read: boolean } & (
  | { kind: "matches"; payload: { total: number; searches: SearchMatches[] } }
  | { kind: "changes"; payload: { lots: { lot: LotSummary; changes: LotChanges }[] } }
  | { kind: "reminder"; payload: { lot: LotSummary; reminders: ("day" | "hour")[]; changes: LotChanges | null } }
);

export type AlertPage = { items: Alert[]; total: number; unread: number };

export const ALERTS_PAGE = 20;

export function getAlerts(kind: AlertKind | null, page: number, token: string, clientIp: string | null = null): Promise<AlertPage> {
  const search = new URLSearchParams({ limit: String(ALERTS_PAGE), offset: String((page - 1) * ALERTS_PAGE) });
  if (kind) search.set("kind", kind);
  return api<AlertPage>(`/api/me/alerts?${search}`, { token, clientIp });
}

/** How many alerts are unread, for the banner; none when the API cannot say. */
export async function unreadAlerts(token: string, clientIp: string | null = null): Promise<number> {
  try {
    return (await api<{ unread: number }>("/api/me/alerts/unread", { token, clientIp })).unread;
  } catch {
    return 0;
  }
}

/** Marks these alerts read, or every one with null; returns how many stay unread. */
export async function markAlertsRead(ids: number[] | null, token: string, clientIp: string | null = null): Promise<number> {
  const body = ids ? { ids } : {};
  return (await api<{ unread: number }>("/api/me/alerts/read", { method: "POST", body, token, clientIp })).unread;
}

export type AlertSettings = {
  email_matches: boolean;
  email_changes: boolean;
  email_reminders: boolean;
  /** Search summaries at 7 AM and 5 PM rather than 7 AM only. */
  twice_daily: boolean;
  /** Null until the dealer's first alert or Settings sets them. */
  time_zone: string | null;
  locale: Locale | null;
};

export type ChosenSettings = Omit<AlertSettings, "time_zone" | "locale"> & { time_zone: string; locale: Locale };

export function getAlertSettings(token: string, clientIp: string | null = null): Promise<AlertSettings> {
  return api<AlertSettings>("/api/me/alert-settings", { token, clientIp });
}

export function saveAlertSettings(settings: ChosenSettings, token: string, clientIp: string | null = null): Promise<AlertSettings> {
  return api<AlertSettings>("/api/me/alert-settings", { method: "PUT", body: settings, token, clientIp });
}
