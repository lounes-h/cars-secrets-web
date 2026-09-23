/**
 * What a lot's auction codes mean in plain words, and how much each one should worry a buyer.
 * The lot page reads its badges and its labels from here, so a code is
 * translated in one place. An unknown code is shown as it came, neutral, rather than guessed at.
 * Titles are Copart's own words, not ours: see `titleType`.
 * ponytail: Copart's codes only, since Copart is the only source; key by source when a second arrives.
 */

import COPART_TITLES from "@/lib/copart-titles.json";
import type { Lot } from "@/lib/lots";

export type Tone = "good" | "warn" | "bad" | "neutral";
export type Signal = { label: string; tone: Tone };

/** `badge: false` marks the normal case, which gets a label but no badge. */
type Entry = Signal & { badge?: false };

/** Keyed by the auction's code, trimmed and upper-cased. */
export const SIGNALS: Record<"run" | "keys" | "odometer" | "sale", Record<string, Entry>> = {
  run: {
    "RUN & DRIVE VERIFIED": { label: "Runs and drives", tone: "good" },
    "VEHICLE STARTS": { label: "Engine starts only", tone: "warn" },
    // Copart's "DEFAULT" is a lot nobody checked: treat it as stationary until proven otherwise.
    DEFAULT: { label: "Not verified to start", tone: "bad" },
    "": { label: "Not verified to start", tone: "bad" },
  },
  keys: {
    YES: { label: "Keys", tone: "good" },
    NO: { label: "No keys", tone: "warn" },
    EXM: { label: "Keys exempt", tone: "neutral" },
    "": { label: "Keys not stated", tone: "neutral" },
  },
  odometer: {
    A: { label: "Actual mileage", tone: "good", badge: false },
    E: { label: "Mileage exempt", tone: "warn" },
    N: { label: "Mileage not real", tone: "bad" },
    X: { label: "Exceeds mechanical limits", tone: "bad" },
    "": { label: "Mileage status not stated", tone: "neutral", badge: false },
  },
  sale: {
    "PURE SALE": { label: "Pure sale", tone: "good" },
    "ON MINIMUM BID": { label: "Minimum bid", tone: "warn" },
    "ON APPROVAL": { label: "Seller must approve", tone: "warn" },
    "": { label: "Sale status not stated", tone: "neutral" },
  },
};

function lookup(kind: keyof typeof SIGNALS, value: string | null): Entry {
  const code = (value ?? "").trim().toUpperCase();
  return SIGNALS[kind][code] ?? { label: value!.trim(), tone: "neutral" };
}

export const runStatus = (lot: Lot) => lookup("run", lot.runs_drives);
export const keys = (lot: Lot) => lookup("keys", lot.has_keys);
/** Copart's title groups, which decide the badge's colour: clean, salvage, non-repairable. */
const TITLE_GROUP_TONES: Record<string, Tone> = { C: "good", S: "warn", J: "bad" };

/**
 * Copart's capitals: each space-separated word's first letter upper case, even after a bracket, and
 * the rest lower case: "Dis/dlr/exp Lien Papers-salv", "Wrecker's Notice (Parts Only)".
 */
export const copartCase = (text: string) =>
  text.toLowerCase().replace(/(^|\s)([^\sa-z]*)([a-z])/g, (_, space: string, lead: string, first: string) => space + lead + first.toUpperCase());

/**
 * The title as copart.com shows it: "OR - Lien Papers Salvage". The export carries only the state and
 * a code, and Copart words and groups the same code differently by state, so the wording and group
 * come from `copart-titles.json`, keyed "STATE CODE" and read off copart.com. A pair it does not hold
 * yet shows as the code ("OR - LS"), neutral, since its colour depends on the state.
 */
export function titleType(lot: Lot): Entry {
  const code = lot.title_type?.trim().toUpperCase();
  if (!code) return { label: "Title not stated", tone: "neutral" };
  const state = lot.title_state?.trim().toUpperCase();
  const known: string[] | undefined = (COPART_TITLES as Record<string, string[]>)[`${state} ${code}`];
  const words = known ? copartCase(known[0]) : code;
  return { label: state ? `${state} - ${words}` : words, tone: (known && TITLE_GROUP_TONES[known[1]]) || "neutral" };
}
export const odometerStatus = (lot: Lot) => lookup("odometer", lot.odometer_brand);
export const saleStatus = (lot: Lot) => lookup("sale", lot.sale_status);

/** The deal breakers, always in this order so a returning buyer knows where to look. */
export function badges(lot: Lot): Signal[] {
  return [runStatus(lot), keys(lot), titleType(lot), odometerStatus(lot), saleStatus(lot)]
    .filter((entry) => entry.badge !== false)
    .map(({ label, tone }) => ({ label, tone }));
}


/** Time left before the sale, and how urgent it is: amber under a day, red under an hour. */
export function countdown(saleAt: string, now: Date): Signal | null {
  const left = new Date(saleAt).getTime() - now.getTime();
  if (Number.isNaN(left)) return null;
  if (left <= 0) return { label: "Sale time has passed", tone: "neutral" };
  const minutes = Math.floor(left / 60_000);
  const [d, h, m] = [Math.floor(minutes / 1440), Math.floor(minutes / 60) % 24, minutes % 60];
  const label = d > 0 ? `Sells in ${d}d ${h}h` : `Sells in ${h}h ${m}m`;
  return { label, tone: left < 3_600_000 ? "bad" : left < 86_400_000 ? "warn" : "neutral" };
}

/**
 * Drive as a dealer says it: "FRONT WHEEL DRIVE" reads "FWD", "4X4 W/REAR WHEEL DRV" and
 * "FOUR BY FOUR" read "4WD". Anything else shows as it came; "UNKNOWN" and "NONE" say nothing.
 */
export function driveType(lot: Lot): string | null {
  const drive = lot.drive?.trim() ?? "";
  if (/^(|unknown|none)$/i.test(drive)) return null;
  if (/^(4x4|four by four)/i.test(drive)) return "4WD";
  if (/^all/i.test(drive)) return "AWD";
  if (/^front/i.test(drive)) return "FWD";
  if (/^rear/i.test(drive)) return "RWD";
  return drive;
}

/** Engine and cylinders as one spec: "2.4L 4" with 4 cylinders reads "2.4L 4-cyl". */
export function engineSpec(lot: Lot): string {
  const cylinders = lot.cylinders?.trim();
  let engine = lot.engine?.trim();
  if (cylinders && engine?.endsWith(` ${cylinders}`)) engine = engine.slice(0, -cylinders.length - 1);
  return [engine, cylinders && `${cylinders}-cyl`].filter(Boolean).join(" ") || "—";
}
