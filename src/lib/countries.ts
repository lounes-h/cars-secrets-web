import { DIAL_CODES } from "@/lib/dial-codes";
import { PHONE_FORMATS } from "@/lib/phone-formats";
import { TIMEZONE_COUNTRIES } from "@/lib/timezone-countries";

export type Country = {
  code: string;
  name: string;
  flag: string;
  dialCode: number;
  /** An example national number, shown as the field's placeholder. */
  example: string;
  /** The national number lengths this country allows. */
  lengths: readonly number[];
};

/** 🇫🇷 from "FR": each letter maps to its regional indicator symbol. */
export function flagEmoji(code: string): string {
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

/** Every country with a calling code, named in the given locale and sorted by name. */
export function countries(locale = "en"): Country[] {
  const names = new Intl.DisplayNames([locale], { type: "region" });
  const name = (code: string) => {
    try {
      return names.of(code) ?? code;
    } catch {
      return code;
    }
  };
  return DIAL_CODES.map(([code, dialCode]) => ({
    code,
    dialCode,
    flag: flagEmoji(code),
    name: name(code),
    example: PHONE_FORMATS[code]?.example ?? "",
    lengths: PHONE_FORMATS[code]?.lengths ?? [],
  })).sort((a, b) => a.name.localeCompare(b.name, locale));
}

/**
 * Digits typed so far, laid into the shape of the country's example: "2015550123" with the
 * example "(201) 555-0123" gives "(201) 555-0123", and "20155" gives "(201) 55". The example
 * is also the ceiling: digits past it are dropped, so a number never outgrows its placeholder.
 */
export function formatNational(example: string, typed: string): string {
  const digits = typed.replace(/\D/g, "");
  let formatted = "";
  let next = 0;
  for (const character of example) {
    if (next >= digits.length) break;
    formatted += /\d/.test(character) ? digits[next++] : character;
  }
  return formatted;
}

/**
 * Country code + national number typed by the user → "+<calling code><digits>", or null when
 * empty. A national trunk prefix ("06…" in France) is left in: the API normalizes to E.164.
 */
export function composePhone(countryCode: string, national: string): string | null {
  const digits = national.replace(/\D/g, "");
  if (!digits) return null;
  const entry = DIAL_CODES.find(([code]) => code === countryCode.toUpperCase());
  return entry ? `+${entry[1]}${digits}` : null;
}

/**
 * The visitor's country as the browser knows it: its time zone first, because that follows
 * where the visitor is rather than which language they read, then its languages. Returns null
 * when the browser tells us nothing usable, so the server's guess stands.
 */
export function countryFromBrowser(
  timeZone: string | undefined,
  languages: readonly string[] | undefined,
): string | null {
  const known = new Set(DIAL_CODES.map(([code]) => code));
  const fromZone = timeZone ? TIMEZONE_COUNTRIES[timeZone] : undefined;
  if (fromZone && known.has(fromZone)) return fromZone;
  const fromLanguages = countryFromLanguages((languages ?? []).join(","), "");
  return fromLanguages && known.has(fromLanguages) ? fromLanguages : null;
}

/**
 * The visitor's likely country from Accept-Language ("fr-FR,fr;q=0.9,en-US;q=0.8" → "FR"): the
 * first language tag with a region that has a calling code. Falls back to `fallback`.
 */
export function countryFromLanguages(header: string | null | undefined, fallback = "US"): string {
  const known = new Set(DIAL_CODES.map(([code]) => code));
  for (const part of (header ?? "").split(",")) {
    const tag = part.split(";")[0].trim();
    const region = tag.split("-").slice(1).find((sub) => /^[A-Za-z]{2}$/.test(sub))?.toUpperCase();
    if (region && known.has(region)) return region;
  }
  return fallback;
}
