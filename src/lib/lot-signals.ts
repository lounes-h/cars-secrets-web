/**
 * What a lot's auction codes mean in plain words, and how much each one should worry a buyer.
 * The lot page reads its badges and its labels from here; the words themselves are in
 * `lot-words.ts`, which the lot list's filters share, so a code is translated in one place.
 * An unknown code is shown as it came, neutral, rather than guessed at.
 * Titles are Copart's own words, not ours: see `titleType`.
 * ponytail: Copart's codes only, since Copart is the only source; key by source when a second arrives.
 */

import COPART_TITLES from "@/lib/copart-titles.json";
import { type Entry, type Signal, SIGNALS, type Tone, VEHICLE_TYPES } from "@/lib/lot-words";
import { type Lot, offsiteAddress, sellerName } from "@/lib/lots";

export { SIGNALS, type Signal, type Tone } from "@/lib/lot-words";

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

/**
 * Whether an insurer sells the lot, read from the seller's name: neither the export nor copart.com
 * has a seller type. An insurer sells because of a claim, which makes swapped or missing parts and
 * a rolled-back odometer rarer. The export names the seller for about a third of lots.
 * ponytail: a name pattern; an insurer named without one of these words reads as not one, so add it here.
 */
const INSURER = /\b(insurance|assurance|mutual|casualty|indemnity|geico|progressive|usaa|csaa|allstate|esurance|safeco|travelers|amica)\b|\bins\./i;

export function sellerType(lot: Lot): Entry {
  const name = sellerName(lot);
  // No seller named tells a buyer nothing, so it gets no badge.
  if (!name) return { label: "Seller not stated", tone: "neutral", badge: false };
  return INSURER.test(name) ? { label: "Insurance seller", tone: "good" } : { label: "Not an insurance seller", tone: "neutral" };
}

/** A lot held away from the auction's yard is picked up at its offsite address, not at the yard. */
export const offsite = (lot: Lot): Entry =>
  offsiteAddress(lot) ? { label: "Offsite", tone: "warn" } : { label: "At the yard", tone: "neutral", badge: false };

/** The deal breakers, always in this order so a returning buyer knows where to look. */
export function badges(lot: Lot): Signal[] {
  return [runStatus(lot), keys(lot), titleType(lot), odometerStatus(lot), saleStatus(lot), sellerType(lot), offsite(lot)]
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

/** The lot's vehicle type in words; a code the table does not know shows as it came. */
export function vehicleType(lot: Lot): string | null {
  const code = lot.vehicle_type?.trim();
  return (code && VEHICLE_TYPES[code.toUpperCase()]) || code || null;
}

/** Engine and cylinders as one spec: "2.4L 4" with 4 cylinders reads "2.4L 4-cyl". */
export function engineSpec(lot: Lot): string {
  const cylinders = lot.cylinders?.trim();
  let engine = lot.engine?.trim();
  if (cylinders && engine?.endsWith(` ${cylinders}`)) engine = engine.slice(0, -cylinders.length - 1);
  return [engine, cylinders && `${cylinders}-cyl`].filter(Boolean).join(" ") || "—";
}
