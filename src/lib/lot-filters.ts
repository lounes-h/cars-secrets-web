/**
 * The lot list's search, filters and order: what each filter is, how it travels in the URL, and
 * how a chosen value reads as a chip. The URL parameters are the API's own (`/api/lots`), so a
 * query string passes straight through once it is valid. Free of server code: the browser's
 * filter bar shares it.
 */

import { auctionName, SIGNALS, VEHICLE_TYPES } from "@/lib/lot-words";

/** Each parameter's values, valid and in a fixed order, so equal filters make equal URLs. */
export type Query = Record<string, string[]>;

export type Option = { value: string; label: string; chip?: string };

export type Filter = {
  /** Its URL parameter, and the name the API counts it by; a range uses `range` instead. */
  id: string;
  label: string;
  group: "main" | "car" | "condition" | "sale" | "where";
  /** Several options, one option, one value of a long list, a range, or a switch. */
  kind: "options" | "single" | "select" | "range" | "toggle";
  /** Fixed options. Without them, the options are what the counts find. */
  options?: Option[];
  /** How a value without a fixed option reads ("V" is "Automobile"); the value itself otherwise. */
  name?: (value: string) => string;
  range?: { min?: string; max?: string; unit: "year" | "mi" | "$" };
  /** Hidden while every lot has the same value, as the auction does while Copart is the only one. */
  hideWhenSingle?: boolean;
};

const signal = (kind: keyof typeof SIGNALS, code: string) => SIGNALS[kind][code].label;

export const FILTERS: Filter[] = [
  {
    id: "sale",
    label: "Sale date",
    group: "main",
    kind: "single",
    options: [
      { value: "today", label: "Today", chip: "Sells today" },
      { value: "tomorrow", label: "Tomorrow", chip: "Sells tomorrow" },
      { value: "this_week", label: "This week", chip: "Sells this week" },
      { value: "next_week", label: "Next week", chip: "Sells next week" },
      // Copart's own name for a lot it has given no sale day yet, as the lot page says.
      { value: "future", label: "Future sale" },
    ],
  },
  {
    id: "title",
    label: "Title",
    group: "main",
    kind: "options",
    options: [
      { value: "salvage", label: "Salvage", chip: "Salvage title" },
      { value: "clean", label: "Clean", chip: "Clean title" },
      { value: "nonrepairable", label: "Non-repairable", chip: "Non-repairable title" },
    ],
  },
  {
    id: "run",
    label: "Runs and drives",
    group: "main",
    kind: "options",
    options: [
      { value: "verified", label: signal("run", "RUN & DRIVE VERIFIED") },
      { value: "starts", label: signal("run", "VEHICLE STARTS") },
      { value: "unverified", label: signal("run", "DEFAULT") },
    ],
  },
  { id: "damage", label: "Damage", group: "main", kind: "options" },
  { id: "year", label: "Year", group: "car", kind: "range", range: { min: "year_min", max: "year_max", unit: "year" } },
  { id: "make", label: "Make", group: "car", kind: "select" },
  { id: "model", label: "Model", group: "car", kind: "select" },
  { id: "mileage", label: "Mileage", group: "car", kind: "range", range: { max: "odometer_max", unit: "mi" } },
  {
    id: "vehicle_type",
    label: "Vehicle type",
    group: "car",
    kind: "options",
    name: (code) => VEHICLE_TYPES[code.toUpperCase()] ?? code,
  },
  {
    id: "keys",
    label: "Keys",
    group: "condition",
    kind: "options",
    options: [
      { value: "yes", label: signal("keys", "YES") },
      { value: "no", label: signal("keys", "NO") },
      { value: "exempt", label: signal("keys", "EXM") },
    ],
  },
  { id: "damage2", label: "Secondary damage", group: "condition", kind: "options" },
  {
    id: "sale_type",
    label: "Sale type",
    group: "sale",
    kind: "options",
    options: [
      { value: "pure", label: signal("sale", "PURE SALE") },
      { value: "minimum", label: signal("sale", "ON MINIMUM BID") },
      { value: "approval", label: signal("sale", "ON APPROVAL") },
    ],
  },
  { id: "buy_now", label: "Buy now available", group: "sale", kind: "toggle" },
  { id: "retail", label: "Retail value", group: "sale", kind: "range", range: { min: "retail_min", max: "retail_max", unit: "$" } },
  { id: "bin", label: "Buy now price", group: "sale", kind: "range", range: { max: "bin_max", unit: "$" } },
  { id: "bid", label: "Current bid", group: "sale", kind: "range", range: { max: "bid_max", unit: "$" } },
  { id: "source", label: "Auction", group: "sale", kind: "options", name: auctionName, hideWhenSingle: true },
  { id: "state", label: "State or province", group: "where", kind: "options" },
  {
    id: "location",
    label: "Location",
    group: "where",
    kind: "options",
    options: [
      { value: "yard", label: "At the yard" },
      { value: "offsite", label: "Offsite" },
    ],
  },
];

export const GROUPS: { id: Filter["group"]; label: string }[] = [
  { id: "main", label: "Sale date, title and damage" },
  { id: "car", label: "The car" },
  { id: "condition", label: "Condition" },
  { id: "sale", label: "The sale" },
  { id: "where", label: "Where" },
];

/** The filters always in the bar, most important first; the others wait in "All filters". */
export const PRIMARY = FILTERS.filter((filter) => filter.group === "main").map((filter) => filter.id);
/** Filters counted per option by the API: everything but the ranges. */
export const COUNTED = FILTERS.filter((filter) => filter.kind !== "range").map((filter) => filter.id);

export const SORTS: Option[] = [
  { value: "newest", label: "Newest listed" },
  { value: "sale", label: "Sale soonest" },
  { value: "year", label: "Year, newest first" },
  { value: "mileage", label: "Mileage, lowest first" },
  { value: "retail", label: "Retail value, lowest first" },
];

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
  if (SORTS.some((option) => option.value === sort)) query.sort = [sort!];
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

/** Where the list shows this query; page 1 has no page number. */
export function listPath(query: Query, page = 1): string {
  const search = queryString(page > 1 ? { ...query, page: [String(page)] } : query);
  return search ? `/active-lots?${search}` : "/active-lots";
}

/** What is kept for the dealer's next visit: filters and order, not the words of a search. */
export function rememberable(query: Query): Query {
  const rest = { ...query };
  delete rest.q;
  return rest;
}

/** The filters with a value chosen, in the bar's order. */
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

/** The filters from "All filters" the dealer sets most, which earn a place in the bar. */
export function promoted(usage: Record<string, number>): string[] {
  return FILTERS.filter((filter) => !PRIMARY.includes(filter.id) && filter.id !== "model")
    .map((filter) => ({ id: filter.id, uses: Math.max(0, ...paramsOf(filter).map((param) => usage[param] ?? 0)) }))
    .filter(({ uses }) => uses >= PROMOTE_AFTER)
    .sort((a, b) => b.uses - a.uses)
    .slice(0, 2)
    .map(({ id }) => id);
}

const count = new Intl.NumberFormat("en-US");
const dollars = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export function amountIn(unit: "year" | "mi" | "$", value: string): string {
  const number = Number(value);
  return unit === "$" ? dollars.format(number) : unit === "mi" ? `${count.format(number)} mi` : value;
}

/** How one of a filter's values reads in its list. */
export function valueLabel(filter: Filter, value: string): string {
  return filter.options?.find((option) => option.value === value)?.label ?? filter.name?.(value) ?? value;
}

export type Chip = { key: string; label: string; without: Query };

/** One removable chip per chosen value (one per range), and the query without it. */
export function chips(query: Query): Chip[] {
  const found: Chip[] = [];
  if (query.q) found.push({ key: "q", label: `“${query.q[0]}”`, without: edit(query, { q: null }) });
  for (const filter of FILTERS) {
    if (filter.range) {
      const { min, max, unit } = filter.range;
      const [low, high] = [min && query[min]?.[0], max && query[max]?.[0]];
      if (!low && !high) continue;
      const span = low && high ? `${amountIn(unit, low)}–${amountIn(unit, high)}` : low ? `from ${amountIn(unit, low)}` : `up to ${amountIn(unit, high!)}`;
      const without = edit(query, Object.fromEntries(paramsOf(filter).map((param) => [param, null])));
      found.push({ key: filter.id, label: `${filter.label} ${span}`, without });
      continue;
    }
    for (const value of query[filter.id] ?? []) {
      const option = filter.options?.find((one) => one.value === value);
      const label =
        filter.kind === "toggle" ? filter.label
        : option ? (option.chip ?? option.label)
        : filter.kind === "select" ? value
        : `${filter.label}: ${valueLabel(filter, value)}`;
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
