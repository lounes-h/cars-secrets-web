/**
 * What a lot's auction codes mean in plain words, and how much each one should worry a buyer.
 * The lot page reads its badges and its labels from here, so a code is
 * translated in one place. An unknown code is shown as it came, neutral, rather than guessed at.
 * ponytail: Copart's codes only, since Copart is the only source; key by source when a second arrives.
 */

import type { Lot } from "@/lib/lots";

export type Tone = "good" | "warn" | "bad" | "neutral";
export type Signal = { label: string; tone: Tone };

/** `badge: false` marks the normal case, which gets a label but no badge. */
type Entry = Signal & { badge?: false };

/** Keyed by the auction's code, trimmed and upper-cased. */
export const SIGNALS: Record<"run" | "keys" | "title" | "odometer" | "sale", Record<string, Entry>> = {
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
  // As copart.com shows it after the state ("WV - Salvage Certificate"), word for word, and only
  // what has been checked there. A code without checked wording shows as the code, keeping its colour.
  // ponytail: one wording per code for every state; key by state if Copart's differs by state.
  title: {
    CT: { label: "Certificate Of Title", tone: "good" },
    SC: { label: "Salvage Certificate", tone: "warn" },
    ST: { label: "ST", tone: "warn" },
    SV: { label: "SV", tone: "warn" },
    RB: { label: "RB", tone: "warn" },
    NR: { label: "NR", tone: "bad" },
    CD: { label: "CD", tone: "bad" },
    "": { label: "Title not stated", tone: "neutral" },
  },
  odometer: {
    A: { label: "Actual mileage", tone: "good", badge: false },
    E: { label: "Mileage exempt", tone: "warn" },
    N: { label: "Mileage not real", tone: "bad" },
    X: { label: "Exceeds mechanical limits", tone: "bad" },
    "": { label: "Mileage status not stated", tone: "neutral", badge: false },
  },
  sale: {
    "PURE SALE": { label: "Pure sale", tone: "good", badge: false },
    "ON MINIMUM BID": { label: "Minimum bid", tone: "warn" },
    "ON APPROVAL": { label: "Seller must approve", tone: "warn" },
    "": { label: "Sale status not stated", tone: "neutral", badge: false },
  },
};

function lookup(kind: keyof typeof SIGNALS, value: string | null): Entry {
  const code = (value ?? "").trim().toUpperCase();
  return SIGNALS[kind][code] ?? { label: value!.trim(), tone: "neutral" };
}

export const runStatus = (lot: Lot) => lookup("run", lot.runs_drives);
export const keys = (lot: Lot) => lookup("keys", lot.has_keys);
/** The title as copart.com shows it: "WV - Salvage Certificate", or "WV - S1" for a code it has no wording for. */
export const titleType = (lot: Lot): Entry => {
  const { label, tone } = lookup("title", lot.title_type);
  if (!lot.title_type?.trim()) return { label, tone };
  return { label: [lot.title_state?.trim(), label].filter(Boolean).join(" - "), tone };
};
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

/** Engine and cylinders as one spec: "2.4L 4" with 4 cylinders reads "2.4L 4-cyl". */
export function engineSpec(lot: Lot): string {
  const cylinders = lot.cylinders?.trim();
  let engine = lot.engine?.trim();
  if (cylinders && engine?.endsWith(` ${cylinders}`)) engine = engine.slice(0, -cylinders.length - 1);
  return [engine, cylinders && `${cylinders}-cyl`].filter(Boolean).join(" ") || "—";
}
