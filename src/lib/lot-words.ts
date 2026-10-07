/**
 * What the auctions' codes mean, kept apart from the rest of the lot helpers so the browser can
 * have them (the lot list's filters) without the title table or the API client. Each code maps
 * to a key of the messages' `signals`, whose words are in every language; the lot page's badges
 * (`lot-signals.ts`) and the filters read the same keys from here.
 */

import { lookup } from "@/lib/i18n";
import type { Messages } from "@/messages/en";

/** The auction's own name for its slug in the URL: "copart" is "Copart", "iaa" is "IAA". */
const AUCTIONS: Record<string, string> = { copart: "Copart", iaa: "IAA", manheim: "Manheim" };
export const auctionName = (source: string) => AUCTIONS[source.toLowerCase()] ?? source;

export type Tone = "good" | "warn" | "bad" | "neutral";
export type Signal = { label: string; tone: Tone };
/** A code's words, as a key of the messages' `signals`. */
export type Word = keyof Messages["signals"];

/** `badge: false` marks the normal case, which gets a label but no badge. */
export type Entry = { word: Word; tone: Tone; badge?: false };

/** Keyed by the auction's code, trimmed and upper-cased. */
export const SIGNALS: Record<"run" | "keys" | "odometer" | "sale", Record<string, Entry>> = {
  run: {
    "RUN & DRIVE VERIFIED": { word: "runsAndDrives", tone: "good" },
    "VEHICLE STARTS": { word: "startsOnly", tone: "warn" },
    // Copart's "DEFAULT" is a lot nobody checked: treat it as stationary until proven otherwise.
    DEFAULT: { word: "notVerified", tone: "bad" },
    "": { word: "notVerified", tone: "bad" },
  },
  keys: {
    YES: { word: "keys", tone: "good" },
    NO: { word: "noKeys", tone: "warn" },
    EXM: { word: "keysExempt", tone: "neutral" },
    "": { word: "keysNotStated", tone: "neutral" },
  },
  odometer: {
    A: { word: "actualMileage", tone: "good", badge: false },
    E: { word: "mileageExempt", tone: "warn" },
    N: { word: "mileageNotReal", tone: "bad" },
    X: { word: "exceedsLimits", tone: "bad" },
    "": { word: "mileageNotStated", tone: "neutral", badge: false },
  },
  sale: {
    "PURE SALE": { word: "pureSale", tone: "good" },
    "ON MINIMUM BID": { word: "minimumBid", tone: "warn" },
    "ON APPROVAL": { word: "sellerApproval", tone: "warn" },
    "": { word: "saleNotStated", tone: "neutral" },
  },
};

/** Copart's vehicle type code in words ("V" is "Automobile"); a code the messages lack shows as it came. */
export const vehicleTypeName = (code: string, m: Messages) => lookup(m.vehicleTypes, code.toUpperCase()) ?? code;
