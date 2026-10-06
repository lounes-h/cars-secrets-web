"use client";

import { ChevronDownIcon, PanelLeftCloseIcon, PanelLeftOpenIcon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState, useTransition } from "react";
import { lotCountsAction, rememberLotFiltersAction } from "@/app/active-lots/actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Field, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sheet, SheetClose, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  activeIds,
  chips,
  COUNTED,
  edit,
  type Filter,
  filterById,
  FILTERS,
  GROUPS,
  listPath,
  paramsOf,
  PRIMARY,
  promoted,
  type Query,
  queryString,
  rememberable,
  SORTS,
  valueLabel,
  ZONE_COOKIE,
} from "@/lib/lot-filters";
import type { Facets } from "@/lib/lots";

const count = new Intl.NumberFormat("en-US");
const lots = (n: number) => `${count.format(n)} ${n === 1 ? "lot" : "lots"}`;

type Counts = { value: string; count: number }[] | null;
type Apply = (next: Query) => void;

/**
 * The lot list's search, filters, order and chips, around the server-rendered results. Every
 * change is a new URL, so the server lists the lots and a list can be shared. The search runs
 * along the top; below it, the filters sit in a sidebar on the left, always there on a wide
 * screen and behind "Filters" on a narrow one, each folding away. Option counts come after the
 * list, since counting is the slow part.
 */
export function LotFilters({
  query,
  total,
  usage,
  remembered,
  children,
}: {
  query: Query;
  total: number;
  /** How often the dealer set each filter parameter: the most used move up into the bar. */
  usage: Record<string, number>;
  /** The filters kept for the dealer's next visit, as last stored. */
  remembered: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const search = queryString(query);
  const keep = queryString(rememberable(query));
  const [counts, setCounts] = useState<{ search: string; facets: Facets } | null>(null);

  function apply(next: Query) {
    // The bar always sets an order, so a URL without parameters means "as I left it".
    const ordered = edit(next, { sort: next.sort ?? ["newest"] });
    startTransition(() => router.push(listPath(ordered), { scroll: false }));
  }

  function countsOf(id: string): Counts {
    return counts?.search === search ? (counts.facets[id] ?? []) : null;
  }

  // The sidebar shows every filter, so every filter is counted, once per list.
  // ponytail: phones count too, sidebar or not; ask only once it is seen if that load matters.
  useEffect(() => {
    let live = true;
    void lotCountsAction(search, COUNTED).then((facets) => {
      if (live) setCounts({ search, facets });
    });
    return () => {
      live = false;
    };
  }, [search]);

  useEffect(() => {
    if (keep !== remembered) void rememberLotFiltersAction(keep);
  }, [keep, remembered]);

  useEffect(() => {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const cookie = `${ZONE_COOKIE}=${encodeURIComponent(zone)}`;
    if (!zone || document.cookie.split("; ").includes(cookie)) return;
    document.cookie = `${cookie}; path=/; max-age=31536000; samesite=lax`;
    // The server could only guess the day in UTC: list "today" again in the dealer's own.
    if (query.sale) router.refresh();
    // On arrival only: the zone does not change while the page is open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const active = activeIds(query);
  const inBar = [...PRIMARY, ...promoted(usage)];
  const found = chips(query);

  function visible(filter: Filter): boolean {
    if (filter.id === "model") return !!query.make;
    if (!filter.hideWhenSingle || query[filter.id]) return true;
    return (countsOf(filter.id)?.length ?? 0) > 1;
  }

  // Every filter, grouped, each folding away: in the sidebar, which leaves out the bar's own
  // filters beside it, and in the sheet that stands in for both below lg.
  const groups = (place: "side" | "sheet") =>
    GROUPS.map((group) => (
      <section key={group.id} className="mb-6">
        <h3 className="mb-1 font-semibold">{group.label}</h3>
        {FILTERS.filter(
          (filter) => filter.group === group.id && visible(filter) && (place === "sheet" || !PRIMARY.includes(filter.id)),
        ).map((filter) =>
          filter.kind === "toggle" ? (
            <div key={filter.id} className="border-b py-2.5">
              <Control filter={filter} query={query} counts={countsOf(filter.id)} apply={apply} place={place} />
            </div>
          ) : (
            <Fold key={filter.id} filter={filter} query={query} counts={countsOf(filter.id)} apply={apply} place={place} />
          ),
        )}
      </section>
    ));

  return (
    <div>
      {/* Along the top: the search at the far left, up to 28rem, and the bar on the right; below lg
          the search takes a line of its own. The order sits above the lots, with the count and the chips. */}
      <div className="flex flex-wrap items-center gap-2">
        <form
          role="search"
          className="flex w-full gap-2 lg:w-auto lg:max-w-md lg:min-w-60 lg:flex-1"
          onSubmit={(event) => {
            event.preventDefault();
            const q = String(new FormData(event.currentTarget).get("q") ?? "").trim();
            apply(edit(query, { q: q ? [q] : null }));
          }}
        >
          <Label htmlFor="lot-search" className="sr-only">
            Search lots
          </Label>
          <Input
            key={search}
            id="lot-search"
            name="q"
            type="search"
            defaultValue={query.q?.[0] ?? ""}
            maxLength={200}
            placeholder="Make, model, year, VIN, lot number or keyword"
          />
          {/* As tall as the input beside it, like the bar's buttons. */}
          <Button type="submit" size="lg">
            Search
          </Button>
        </form>
        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
          {inBar.map((id) => {
            const filter = filterById(id);
            return visible(filter) ? <Menu key={id} filter={filter} query={query} counts={countsOf(id)} apply={apply} /> : null;
          })}
          <Sheet>
            <SheetTrigger render={<Button variant="outline" size="lg" className="lg:hidden" />}>
              Filters{active.length > 0 && ` · ${active.length}`}
            </SheetTrigger>
            {/* The whole screen on a phone. */}
            <SheetContent className="gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-md">
              <SheetHeader className="border-b">
                <SheetTitle className="text-lg font-semibold">All filters</SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto p-4">{groups("sheet")}</div>
              <SheetFooter className="border-t">
                <SheetClose render={<Button size="lg" className="w-full" />}>Show {lots(total)}</SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* The sidebar can be put away, and the lots then take the whole width. A closed panel leaves
          the page, so the second column is there only while the sidebar is. */}
      <Collapsible defaultOpen className="mt-6 lg:grid lg:items-start lg:gap-8 lg:has-[>aside]:grid-cols-[18rem_minmax(0,1fr)]">
        {/* Stays in view, scrolling on its own, while the lots scroll past. */}
        <CollapsibleContent
          render={<aside />}
          aria-labelledby="all-filters"
          className="hidden lg:sticky lg:top-6 lg:block lg:max-h-[calc(100dvh-3rem)] lg:overflow-y-auto lg:pr-2"
        >
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 id="all-filters" className="text-lg font-semibold">
              All filters
            </h2>
            <CollapsibleTrigger render={<Button variant="ghost" size="icon" aria-label="Hide filters" />}>
              <PanelLeftCloseIcon aria-hidden="true" />
            </CollapsibleTrigger>
          </div>
          {groups("side")}
        </CollapsibleContent>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {/* Brings the sidebar back; only while it is put away, and only where there is one. */}
            <CollapsibleTrigger render={<Button variant="outline" className="hidden lg:inline-flex lg:data-[panel-open]:hidden" />}>
              <PanelLeftOpenIcon aria-hidden="true" />
              Show filters{active.length > 0 && ` · ${active.length}`}
            </CollapsibleTrigger>
            <p aria-live="polite" className="mr-2 font-semibold">
              {lots(total)}
            </p>
            {found.map((chip) => (
              <Button
                key={chip.key}
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full"
                aria-label={`Remove ${chip.label}`}
                onClick={() => apply(chip.without)}
              >
                {chip.label} <XIcon aria-hidden="true" />
              </Button>
            ))}
            {found.length > 0 && (
              <Button type="button" variant="link" size="sm" onClick={() => apply(edit({}, { sort: query.sort ?? null }))}>
                Clear all
              </Button>
            )}
            <Label className="ml-auto font-normal">
              Sort
              <NativeSelect
                size="sm"
                value={query.sort?.[0] ?? "newest"}
                onChange={(event) => apply(edit(query, { sort: [event.target.value] }))}
              >
                {SORTS.map((option) => (
                  <NativeSelectOption key={option.value} value={option.value}>
                    {option.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Label>
          </div>

          <div aria-busy={pending} className={pending ? "opacity-60" : undefined}>
            {children}
          </div>
        </div>
      </Collapsible>
    </div>
  );
}

/** How many values of a filter are chosen; a range counts as one. */
function chosenCount(filter: Filter, query: Query): number {
  return filter.range ? Number(paramsOf(filter).some((param) => query[param])) : (query[filter.id]?.length ?? 0);
}

/** One filter of the sidebar or the sheet: folded away until opened, and open from the start while it holds a choice. */
function Fold({ filter, query, counts, apply, place }: { filter: Filter; query: Query; counts: Counts; apply: Apply; place: string }) {
  const chosen = chosenCount(filter, query);
  return (
    <Collapsible defaultOpen={chosen > 0} className="border-b">
      <CollapsibleTrigger
        render={<Button variant="ghost" className="h-10 w-full justify-between px-0 hover:bg-transparent aria-expanded:bg-transparent [&[data-panel-open]>svg]:rotate-180" />}
      >
        {/* One string, so the name keeps its spaces: "Auction · 1". */}
        {chosen > 0 ? `${filter.label} · ${chosen}` : filter.label}
        <ChevronDownIcon aria-hidden="true" className="transition-transform" />
      </CollapsibleTrigger>
      <CollapsibleContent className="pb-3">
        {/* The open button names the section; the legend names the options for a screen reader. */}
        <FieldSet className="gap-2">
          <FieldLegend className="sr-only">{filter.label}</FieldLegend>
          <Control filter={filter} query={query} counts={counts} apply={apply} place={place} />
        </FieldSet>
      </CollapsibleContent>
    </Collapsible>
  );
}

/** One filter of the bar: its options drop below its button. */
function Menu({
  filter,
  query,
  counts,
  apply,
}: {
  filter: Filter;
  query: Query;
  counts: Counts;
  apply: Apply;
}) {
  const chosen = chosenCount(filter, query);
  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" size="lg" className="hidden lg:inline-flex" />}>
        {filter.label}
        {chosen > 0 && <span className="font-normal">· {chosen}</span>}
        <ChevronDownIcon aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent align="start" className="max-h-96 overflow-y-auto">
        <Control filter={filter} query={query} counts={counts} apply={apply} place="bar" />
      </PopoverContent>
    </Popover>
  );
}

/** A filter's options (with their counts once loaded), its range, or its switch. */
function Control({
  filter,
  query,
  counts,
  apply,
  place,
}: {
  filter: Filter;
  query: Query;
  counts: Counts;
  apply: Apply;
  place: string;
}) {
  const id = `${place}-${filter.id}`;
  if (filter.range) return <Range filter={filter} query={query} apply={apply} id={id} />;
  if (filter.kind === "toggle") {
    return (
      <Choice id={id} label={filter.label} count={counts ? (counts.find((option) => option.value === "yes")?.count ?? 0) : undefined}>
        <Checkbox id={id} checked={!!query[filter.id]} onCheckedChange={(on) => apply(edit(query, { [filter.id]: on ? ["1"] : null }))} />
      </Choice>
    );
  }

  const chosen = query[filter.id] ?? [];
  const known = filter.options ?? counts ?? [];
  const options = [
    ...known.map((option) => ({
      value: option.value,
      label: valueLabel(filter, option.value),
      count: counts ? (counts.find((one) => one.value === option.value)?.count ?? 0) : undefined,
    })),
    // A choice no lot has any more stays listed, so it can be taken back.
    ...chosen
      .filter((value) => !known.some((option) => option.value === value))
      .map((value) => ({ value, label: valueLabel(filter, value), count: counts ? 0 : undefined })),
  ];

  if (filter.kind === "select") {
    return (
      <NativeSelect
        id={id}
        aria-label={filter.label}
        className="w-full"
        value={chosen[0] ?? ""}
        onChange={(event) => {
          const value = event.target.value;
          apply(edit(query, { [filter.id]: value ? [value] : null, ...(filter.id === "make" ? { model: null } : {}) }));
        }}
      >
        <NativeSelectOption value="">Any {filter.label.toLowerCase()}</NativeSelectOption>
        {options.map((option) => (
          <NativeSelectOption key={option.value} value={option.value}>
            {option.label}
            {option.count !== undefined && ` (${count.format(option.count)})`}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    );
  }

  const loading = !filter.options && counts === null && <p className="text-sm text-muted-foreground">Loading…</p>;
  // Nothing to find there with the other filters: shown, so the list does not jump, but off.
  const off = (option: (typeof options)[number], checked: boolean) => option.count === 0 && !checked;
  // Encoded: a value can hold a space ("FRONT END"), which would split the aria-labelledby that
  // names the box. Still one id per value, since the box keeps the label it was first given.
  const optionId = (value: string) => `${id}-${encodeURIComponent(value)}`;

  if (filter.kind === "single") {
    return (
      <RadioGroup value={chosen[0] ?? ""} onValueChange={(value) => apply(edit(query, { [filter.id]: value ? [value as string] : null }))}>
        <Choice id={`${id}-any`} label="Any day">
          <RadioGroupItem id={`${id}-any`} value="" />
        </Choice>
        {options.map((option) => (
          <Choice key={option.value} id={optionId(option.value)} label={option.label} count={option.count} disabled={off(option, chosen.includes(option.value))}>
            <RadioGroupItem id={optionId(option.value)} value={option.value} disabled={off(option, chosen.includes(option.value))} />
          </Choice>
        ))}
        {loading}
      </RadioGroup>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {options.map((option) => {
        const checked = chosen.includes(option.value);
        return (
          <Choice key={option.value} id={optionId(option.value)} label={option.label} count={option.count} disabled={off(option, checked)}>
            <Checkbox
              id={optionId(option.value)}
              checked={checked}
              disabled={off(option, checked)}
              onCheckedChange={(on) =>
                apply(edit(query, { [filter.id]: on ? [...chosen, option.value] : chosen.filter((value) => value !== option.value) }))
              }
            />
          </Choice>
        );
      })}
      {loading}
    </div>
  );
}

/** One option: its checkbox or radio, its words and, once loaded, how many lots have it. */
function Choice({
  id,
  label,
  count: n,
  disabled = false,
  children,
}: {
  id: string;
  label: string;
  count?: number;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <Field orientation="horizontal" data-disabled={disabled}>
      {children}
      {/* The count inside the label, so it is read out with the option. */}
      <FieldLabel htmlFor={id} className="flex-1 font-normal">
        {label}
        {n !== undefined && <span className="ml-auto text-muted-foreground tabular-nums">{count.format(n)}</span>}
      </FieldLabel>
    </Field>
  );
}

const UNITS = { year: "", mi: " (miles)", $: " ($)" };

/** The years a range offers, newest first: this year down to 1900. */
const THIS_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: THIS_YEAR - 1899 }, (_, i) => String(THIS_YEAR - i));

/** A range: whole numbers, applied together. */
function Range({ filter, query, apply, id }: { filter: Filter; query: Query; apply: Apply; id: string }) {
  const { min, max, unit } = filter.range!;
  const bounds = [
    min && { param: min, label: `From${UNITS[unit]}` },
    max && { param: max, label: `${min ? "To" : "Up to"}${UNITS[unit]}` },
  ].filter((bound): bound is { param: string; label: string } => !!bound);
  return (
    <form
      key={queryString(query)}
      className="flex flex-wrap items-end gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        apply(edit(query, Object.fromEntries(bounds.map(({ param }) => {
          const value = String(data.get(param) ?? "").trim();
          return [param, value ? [value] : null];
        }))));
      }}
    >
      {bounds.map(({ param, label }) => (
        <Field key={param} className="w-32 gap-1">
          <FieldLabel htmlFor={`${id}-${param}`} className="font-normal">
            {label}
          </FieldLabel>
          {unit === "year" ? (
            <NativeSelect id={`${id}-${param}`} name={param} className="w-full" defaultValue={query[param]?.[0] ?? ""}>
              <NativeSelectOption value="">Any</NativeSelectOption>
              {YEARS.map((year) => (
                <NativeSelectOption key={year} value={year}>
                  {year}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          ) : (
            <Input
              id={`${id}-${param}`}
              name={param}
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              defaultValue={query[param]?.[0] ?? ""}
            />
          )}
        </Field>
      ))}
      <Button type="submit" variant="outline" size="lg">
        Apply
      </Button>
    </form>
  );
}
