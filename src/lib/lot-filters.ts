/**
 * The lot list's search, filters and order: what each filter is, how it travels in the URL, and
 * how a chosen value reads as a chip. The URL parameters are the API's own (`/api/lots`), so a
 * query string passes straight through once it is valid. Free of server code: the browser's
 * filter bar shares it.
 */

import { fill, type I18n, LOCALES } from "@/lib/i18n";
import { auctionName, vehicleTypeName, type Word } from "@/lib/lot-words";
import type { Messages } from "@/messages/en";

/** Each parameter's values, valid and in a fixed order, so equal filters make equal URLs. */
export type Query = Record<string, string[]>;

/** A fixed option. Its words are the code's (`signal`, shared with the lot page) or the filter's own, in `filters.options`. */
export type Option = { value: string; signal?: Word };

export type Filter = {
  /** Its URL parameter, and the name the API counts it by; a range uses `range` instead. Its label is `filters.labels[id]`. */
  id: keyof Messages["filters"]["labels"];
  /** Its heading in "All filters"; the table's order is the order there. */
  group: (typeof GROUPS)[number];
  /** Several options, one option, one value of a long list, a range, or a switch. */
  kind: "options" | "single" | "select" | "range" | "toggle";
  /** Fixed options. Without them, the options are what the counts find. */
  options?: Option[];
  /** How a value without a fixed option reads ("V" is "Automobile"); the value itself otherwise. */
  name?: (value: string, m: Messages) => string;
  range?: { min?: string; max?: string; unit: "year" | "mi" | "$" };
  /** Hidden while every lot has the same value, as the auction does while Copart is the only one. */
  hideWhenSingle?: boolean;
};

/** An engine as the lot page words it: "2.0L 4" is "2.0L 4-cyl", and "4", the cylinders alone, "4-cyl". */
export const engineName = (value: string, m: Messages) =>
  value.replace(/(^|\s)(\d+)$/, (_, space: string, cylinders: string) => space + fill(m.lot.cylinders, { cylinders }));

export const FILTERS: Filter[] = [
  { id: "vehicle_type", group: "vehicle", kind: "options", name: vehicleTypeName },
  { id: "make", group: "vehicle", kind: "select" },
  { id: "model", group: "vehicle", kind: "select" },
  { id: "year", group: "vehicle", kind: "range", range: { min: "year_min", max: "year_max", unit: "year" } },
  { id: "mileage", group: "vehicle", kind: "range", range: { max: "odometer_max", unit: "mi" } },
  { id: "engine", group: "vehicle", kind: "select", name: engineName },
  {
    id: "run",
    group: "condition",
    kind: "options",
    options: [
      { value: "verified", signal: "runsAndDrives" },
      { value: "starts", signal: "startsOnly" },
      { value: "unverified", signal: "notVerified" },
    ],
  },
  { id: "damage", group: "condition", kind: "options" },
  { id: "damage2", group: "condition", kind: "options" },
  {
    id: "keys",
    group: "condition",
    kind: "options",
    options: [
      { value: "yes", signal: "keys" },
      { value: "no", signal: "noKeys" },
      { value: "exempt", signal: "keysExempt" },
    ],
  },
  { id: "bid", group: "price", kind: "range", range: { max: "bid_max", unit: "$" } },
  { id: "bin", group: "price", kind: "range", range: { max: "bin_max", unit: "$" } },
  { id: "retail", group: "price", kind: "range", range: { min: "retail_min", max: "retail_max", unit: "$" } },
  {
    id: "sale",
    group: "sale",
    kind: "single",
    options: [{ value: "today" }, { value: "tomorrow" }, { value: "this_week" }, { value: "next_week" }, { value: "future" }],
  },
  // The document the sale hands over, so it sits with the sale.
  { id: "title", group: "sale", kind: "options", options: [{ value: "salvage" }, { value: "clean" }, { value: "nonrepairable" }] },
  {
    id: "sale_type",
    group: "sale",
    kind: "options",
    options: [
      { value: "pure", signal: "pureSale" },
      { value: "minimum", signal: "minimumBid" },
      { value: "approval", signal: "sellerApproval" },
    ],
  },
  { id: "buy_now", group: "sale", kind: "toggle" },
  { id: "source", group: "sale", kind: "options", name: auctionName, hideWhenSingle: true },
  { id: "state", group: "location", kind: "options" },
  { id: "location", group: "location", kind: "options", options: [{ value: "yard" }, { value: "offsite" }] },
];

/** "All filters", in the order a dealer narrows a search: what the lot is, its shape, its price, its sale, where it is. */
export const GROUPS = ["vehicle", "condition", "price", "sale", "location"] as const;

/** The filters always in the bar, most important first; the sidebar beside it leaves them out. */
export const PRIMARY = ["sale", "title", "run", "damage", "buy_now"];
/** Filters counted per option by the API: everything but the ranges. */
export const COUNTED = FILTERS.filter((filter) => filter.kind !== "range").map((filter) => filter.id);

/** The orders, each worded in `filters.sorts`. */
export const SORTS = ["newest", "sale", "year", "mileage", "retail"] as const;

export const filterById = (id: string) => FILTERS.find((filter) => filter.id === id)!;

/** A filter's URL parameters: its id, or a range's bounds. */
export const paramsOf = (filter: Filter): string[] =>
  filter.range ? [filter.range.min, filter.range.max].filter((param): param is string => !!param) : [filter.id];

const MAX_VALUES = 50;

function wholeNumber(value: string | null, unit: string): string | null {
  if (!value || !/^\d{1,9}$/.test(value.trim())) return null;
  const number = Number(value);
  if (unit === "year" && (number < 1900 || number > 2100)) return null;
  return String(number);
}

/** Only what the list understands, each value valid: anything else in a URL is dropped. */
export function readQuery(input: URLSearchParams | Record<string, string | string[] | undefined>): Query {
  const params = new URLSearchParams();
  if (input instanceof URLSearchParams) input.forEach((value, key) => params.append(key, value));
  else for (const [key, value] of Object.entries(input)) for (const one of [value ?? []].flat()) params.append(key, one);

  const query: Query = {};
  const q = params.get("q")?.trim().replace(/\s+/g, " ").slice(0, 200);
  if (q) query.q = [q];
  for (const filter of FILTERS) {
    if (filter.range) {
      for (const param of paramsOf(filter)) {
        const number = wholeNumber(params.get(param), filter.range.unit);
        if (number) query[param] = [number];
      }
    } else if (filter.kind === "toggle") {
      if (["1", "true"].includes(params.get(filter.id) ?? "")) query[filter.id] = ["1"];
    } else {
      const allowed = filter.options?.map((option) => option.value);
      const values = [...new Set(params.getAll(filter.id).map((value) => value.trim()))]
        .filter((value) => value && value.length <= 100 && (!allowed || allowed.includes(value)))
        .slice(0, filter.kind === "options" ? MAX_VALUES : 1);
      if (values.length) query[filter.id] = values;
    }
  }
  const sort = params.get("sort");
  if (SORTS.some((option) => option === sort)) query.sort = [sort!];
  return query;
}

export function queryString(query: Query): string {
  return new URLSearchParams(Object.entries(query).flatMap(([key, values]) => values.map((value) => [key, value]))).toString();
}

/** The query with some parameters set (to these values) or removed (null), still valid and in order. */
export function edit(query: Query, changes: Record<string, string[] | null>): Query {
  const next: Query = { ...query };
  for (const [key, values] of Object.entries(changes)) {
    if (values?.length) next[key] = values;
    else delete next[key];
  }
  return readQuery(new URLSearchParams(queryString(next)));
}

/** Where the list shows this query; page 1 has no page number. `saved` is the saved search being edited. */
export function listPath(query: Query, page = 1, saved?: string): string {
  const search = queryString({ ...query, ...(page > 1 && { page: [String(page)] }), ...(saved && { saved: [saved] }) });
  return search ? `/active-lots?${search}` : "/active-lots";
}

/** What a saved search keeps: the filters and the search words, not the order. */
export function searchQuery(query: Query): string {
  const rest = { ...query };
  delete rest.sort;
  return queryString(rest);
}

/** The longest name a saved search may have, as the API allows. */
export const SEARCH_NAME_MAX = 80;

/** A name for a search, from its chips ("TOYOTA, CAMRY, Salvage title"), or "All lots" without any. */
export function searchName(query: Query, i18n: I18n): string {
  const named = chips(query, i18n).map((chip) => chip.label).join(", ");
  return named.slice(0, SEARCH_NAME_MAX) || i18n.m.searches.allLots;
}

/** What is kept for the dealer's next visit: filters and order, not the words of a search. */
export function rememberable(query: Query): Query {
  const rest = { ...query };
  delete rest.q;
  return rest;
}

/** The filters with a value chosen. */
export const activeIds = (query: Query) =>
  FILTERS.filter((filter) => paramsOf(filter).some((param) => query[param])).map((filter) => filter.id);

/** What a search named, turned into filters; null when it named nothing the filters hold. */
export function searched(
  query: Query,
  found: { make: string | null; model: string | null; year_min: number | null; year_max: number | null; q: string },
): Query | null {
  if (!found.make && found.year_min == null) return null;
  const changes: Record<string, string[] | null> = { q: found.q ? [found.q] : null };
  if (found.make) Object.assign(changes, { make: [found.make], model: found.model ? [found.model] : null });
  if (found.year_min != null) Object.assign(changes, { year_min: [String(found.year_min)], year_max: [String(found.year_max)] });
  return edit(query, changes);
}

/** A dealer's filters set this often move up into the bar, up to two of them. */
export const PROMOTE_AFTER = 3;

/** The filters from "All filters" the dealer sets most, which earn a place in the bar. A make
    (and the model that belongs to it) never does: the search beside the bar already takes one. */
export function promoted(usage: Record<string, number>): string[] {
  return FILTERS.filter((filter) => !PRIMARY.includes(filter.id) && filter.id !== "make" && filter.id !== "model")
    .map((filter) => ({ id: filter.id, uses: Math.max(0, ...paramsOf(filter).map((param) => usage[param] ?? 0)) }))
    .filter(({ uses }) => uses >= PROMOTE_AFTER)
    .sort((a, b) => b.uses - a.uses)
    .slice(0, 2)
    .map(({ id }) => id);
}

export function amountIn(unit: "year" | "mi" | "$", value: string, { locale, m }: I18n): string {
  const number = Number(value);
  const tag = LOCALES[locale].tag;
  if (unit === "$") return new Intl.NumberFormat(tag, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(number);
  return unit === "mi" ? fill(m.lot.miles, { miles: new Intl.NumberFormat(tag).format(number) }) : value;
}

type OptionWords = { label: string; chip?: string };

/** A fixed option's words: the code's for a signal, otherwise the filter's own. */
function optionWords(m: Messages, filter: Filter, option: Option): OptionWords {
  if (option.signal) return { label: m.signals[option.signal] };
  return (m.filters.options as Record<string, Record<string, OptionWords>>)[filter.id][option.value];
}

/** How one of a filter's values reads in its list. */
export function valueLabel(m: Messages, filter: Filter, value: string): string {
  const option = filter.options?.find((one) => one.value === value);
  return option ? optionWords(m, filter, option).label : (filter.name?.(value, m) ?? value);
}

export type Chip = { key: string; label: string; without: Query };

/** One removable chip per chosen value (one per range), and the query without it. */
export function chips(query: Query, i18n: I18n): Chip[] {
  const { m } = i18n;
  const words = m.filters;
  const found: Chip[] = [];
  if (query.q) found.push({ key: "q", label: fill(words.chipSearch, { q: query.q[0] }), without: edit(query, { q: null }) });
  for (const filter of FILTERS) {
    const name = words.labels[filter.id];
    if (filter.range) {
      const { min, max, unit } = filter.range;
      const [low, high] = [min && query[min]?.[0], max && query[max]?.[0]];
      if (!low && !high) continue;
      const span =
        low && high ? fill(words.spanBoth, { low: amountIn(unit, low, i18n), high: amountIn(unit, high, i18n) })
        : low ? fill(words.spanFrom, { low: amountIn(unit, low, i18n) })
        : fill(words.spanUpTo, { high: amountIn(unit, high!, i18n) });
      const without = edit(query, Object.fromEntries(paramsOf(filter).map((param) => [param, null])));
      found.push({ key: filter.id, label: fill(words.chipRange, { label: name, span }), without });
      continue;
    }
    for (const value of query[filter.id] ?? []) {
      const option = filter.options?.find((one) => one.value === value);
      const own = option && optionWords(m, filter, option);
      const label =
        filter.kind === "toggle" ? name
        : own ? (own.chip ?? own.label)
        : filter.kind === "select" ? valueLabel(m, filter, value)
        : fill(words.chipValue, { label: name, value: valueLabel(m, filter, value) });
      const rest = query[filter.id].filter((one) => one !== value);
      // A model belongs to its make, so it goes with it.
      const without = edit(query, { [filter.id]: rest, ...(filter.id === "make" ? { model: null } : {}) });
      found.push({ key: `${filter.id}:${value}`, label, without });
    }
  }
  return found;
}

/** The dealer's time zone as the browser names it, kept in a cookie so "today" is their today. */
export const ZONE_COOKIE = "cs_tz";

/** The zone the browser runs in. */
export const browserZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

/** The zone when it is one this runtime knows, otherwise null. */
export function knownZone(zone: string | undefined | null): string | null {
  if (!zone || zone.length > 64) return null;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: zone });
    return zone;
  } catch {
    return null;
  }
}
