"use server";

import type { Result } from "@/app/[lang]/saved/actions";
import { type AlertSettings, type ChosenSettings, saveAlertSettings } from "@/lib/alerts";
import { isLocale } from "@/lib/i18n";
import { actionI18n } from "@/lib/i18n-server";
import { knownZone } from "@/lib/lot-filters";
import { sessionToken, visitorIp } from "@/lib/session";

const SWITCHES = ["email_matches", "email_changes", "email_reminders", "twice_daily"] as const;

/** Keeps which alerts are emailed, how often the search summary comes, and in which language and zone. */
export async function saveAlertSettingsAction(values: ChosenSettings): Promise<Result<AlertSettings>> {
  const [token, { m }] = await Promise.all([sessionToken(), actionI18n()]);
  const given = (values ?? {}) as Partial<Record<keyof ChosenSettings, unknown>>;
  const zone = knownZone(typeof given.time_zone === "string" ? given.time_zone : null);
  if (!token || !zone || !isLocale(given.locale) || !SWITCHES.every((name) => typeof given[name] === "boolean")) {
    return { error: m.settings.failed };
  }
  const chosen = { ...Object.fromEntries(SWITCHES.map((name) => [name, given[name]])), time_zone: zone, locale: given.locale } as ChosenSettings;
  try {
    return { value: await saveAlertSettings(chosen, token, await visitorIp()) };
  } catch {
    return { error: m.settings.failed };
  }
}
