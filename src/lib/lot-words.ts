/**
 * The words the site uses for the auctions' codes, kept apart from the rest of the lot helpers so
 * the browser can have them (the lot list's filters) without the title table or the API client.
 * The lot page's badges (`lot-signals.ts`) and the filters read the same words from here.
 */

/** The auction's own name for its slug in the URL: "copart" is "Copart", "iaa" is "IAA". */
const AUCTIONS: Record<string, string> = { copart: "Copart", iaa: "IAA", manheim: "Manheim" };
export const auctionName = (source: string) => AUCTIONS[source.toLowerCase()] ?? source;

export type Tone = "good" | "warn" | "bad" | "neutral";
export type Signal = { label: string; tone: Tone };

/** `badge: false` marks the normal case, which gets a label but no badge. */
export type Entry = Signal & { badge?: false };

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

/** Copart's vehicle type codes in copart.com's words, made singular: its lot details call "K" "MEDIUM DUTY/BOX TRUCKS". */
export const VEHICLE_TYPES: Record<string, string> = {
  V: "Automobile",
  K: "Medium duty / box truck",
  U: "Heavy duty truck",
  B: "Bus",
  R: "Recreational vehicle (RV)",
  L: "Trailer",
  C: "Motorcycle",
  D: "Dirt bike",
  A: "ATV",
  S: "Snowmobile",
  M: "Boat",
  J: "Jet ski",
  E: "Industrial equipment",
  N: "Construction equipment",
  F: "Agriculture and farm equipment",
  H: "Other goods",
  I: "Inspection",
};
