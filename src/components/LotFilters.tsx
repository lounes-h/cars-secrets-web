"use client";

import { ChevronDownIcon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState, useTransition } from "react";
import { lotCountsAction, rememberLotFiltersAction } from "@/app/active-lots/actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
 * change is a new URL, so the server lists the lots and a list can be shared. Option counts are
 * asked for only when a list is opened, since counting is the slow part.
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
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [counts, setCounts] = useState<{ search: string; facets: Facets; loaded: string[] } | null>(null);
  // The counts the open lists need: every filter's while "All filters" is open.
  const wanted = (sheetOpen ? COUNTED : COUNTED.filter((id) => id === openMenu)).join(",");

  function apply(next: Query) {
    // The bar always sets an order, so a URL without parameters means "as I left it".
    const ordered = edit(next, { sort: next.sort ?? ["newest"] });
    startTransition(() => router.push(listPath(ordered), { scroll: false }));
  }

  function countsOf(id: string): Counts {
    if (counts?.search !== search || !counts.loaded.includes(id)) return null;
    return counts.facets[id] ?? [];
  }

  useEffect(() => {
    if (!wanted) return;
    let live = true;
    const names = wanted.split(",");
    void lotCountsAction(search, names).then((facets) => {
      if (!live) return;
      setCounts((last) => {
        const same = last?.search === search;
        return {
          search,
          facets: { ...(same ? last.facets : {}), ...facets },
          loaded: [...new Set([...(same ? last.loaded : []), ...names])],
        };
      });
    });
    return () => {
      live = false;
    };
  }, [search, wanted]);

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
  const hidden = active.filter((id) => !inBar.includes(id)).length;
  const found = chips(query);

  function visible(filter: Filter): boolean {
    if (filter.id === "model") return !!query.make;
    if (!filter.hideWhenSingle || query[filter.id]) return true;
    return (countsOf(filter.id)?.length ?? 0) > 1;
  }

  return (
    <div>
      {/* One line: the search on the left, up to 28rem, and the filters on the right; below lg the
          search takes a line of its own. The order sits on the line below, with the count and the chips. */}
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
          {/* As tall as the input beside it (h-12). */}
          <Button type="submit" className="h-12">
            Search
          </Button>
        </form>
        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
          {inBar.map((id) => {
            const filter = filterById(id);
            return visible(filter) ? (
              <Menu
                key={id}
                filter={filter}
                query={query}
                counts={countsOf(id)}
                apply={apply}
                // Another menu may open before this one reports closing.
                onOpenChange={(open) => setOpenMenu((current) => (open ? id : current === id ? null : current))}
              />
            ) : null;
          })}
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger render={<Button variant="outline" />}>
              <span className="lg:hidden">Filters{active.length > 0 && ` · ${active.length}`}</span>
              <span className="hidden lg:inline">All filters{hidden > 0 && ` · ${hidden}`}</span>
            </SheetTrigger>
            {/* The whole screen on a phone. */}
            <SheetContent className="gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-md">
              <SheetHeader className="border-b">
                <SheetTitle className="text-xl font-semibold">All filters</SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto p-4">
                {GROUPS.map((group) => {
                  const shown = FILTERS.filter((filter) => filter.group === group.id && visible(filter));
                  return (
                    <section key={group.id} className="mb-6 flex flex-col gap-4">
                      <h3 className="font-semibold">{group.label}</h3>
                      {shown.map((filter) =>
                        filter.kind === "toggle" ? (
                          <Control key={filter.id} filter={filter} query={query} counts={countsOf(filter.id)} apply={apply} place="panel" />
                        ) : (
                          <FieldSet key={filter.id} className="gap-2">
                            <FieldLegend variant="label">{filter.label}</FieldLegend>
                            <Control filter={filter} query={query} counts={countsOf(filter.id)} apply={apply} place="panel" />
                          </FieldSet>
                        ),
                      )}
                    </section>
                  );
                })}
              </div>
              <SheetFooter className="border-t">
                <SheetClose render={<Button className="w-full" />}>Show {lots(total)}</SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
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
  );
}

/** One filter of the bar: its options drop below its button. */
function Menu({
  filter,
  query,
  counts,
  apply,
  onOpenChange,
}: {
  filter: Filter;
  query: Query;
  counts: Counts;
  apply: Apply;
  onOpenChange: (open: boolean) => void;
}) {
  const chosen = filter.range ? Number(paramsOf(filter).some((param) => query[param])) : (query[filter.id]?.length ?? 0);
  return (
    <Popover onOpenChange={onOpenChange}>
      <PopoverTrigger render={<Button variant="outline" className="hidden lg:inline-flex" />}>
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
          <Input
            id={`${id}-${param}`}
            name={param}
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            defaultValue={query[param]?.[0] ?? ""}
          />
        </Field>
      ))}
      <Button type="submit" variant="outline">
        Apply
      </Button>
    </form>
  );
}
