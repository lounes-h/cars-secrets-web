"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useRef, useState, useTransition } from "react";
import { lotCountsAction, rememberLotFiltersAction } from "@/app/active-lots/actions";
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
  const [wanted, setWanted] = useState("");
  const [counts, setCounts] = useState<{ search: string; facets: Facets; loaded: string[] } | null>(null);
  const bar = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDialogElement>(null);

  function apply(next: Query) {
    // The bar always sets an order, so a URL without parameters means "as I left it".
    const ordered = edit(next, { sort: next.sort ?? ["newest"] });
    startTransition(() => router.push(listPath(ordered), { scroll: false }));
  }

  /** The counts the open lists need: every filter's while "All filters" is open. */
  function syncWanted() {
    const menus = [...(bar.current?.querySelectorAll<HTMLElement>("details[open]") ?? [])];
    setWanted((panel.current?.open ? COUNTED : menus.map((menu) => menu.dataset.facet ?? "")).filter(Boolean).join(","));
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

  useEffect(() => {
    function close(event: Event) {
      for (const menu of bar.current?.querySelectorAll("details[open]") ?? []) {
        const escape = event instanceof KeyboardEvent && event.key === "Escape";
        if (escape || (event.type === "click" && !menu.contains(event.target as Node))) menu.removeAttribute("open");
      }
    }
    document.addEventListener("click", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("click", close);
      document.removeEventListener("keydown", close);
    };
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
    <div className="mt-8">
      <form
        role="search"
        className="flex max-w-3xl gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const q = String(new FormData(event.currentTarget).get("q") ?? "").trim();
          apply(edit(query, { q: q ? [q] : null }));
        }}
      >
        <label htmlFor="lot-search" className="sr-only">
          Search lots
        </label>
        <input
          key={search}
          id="lot-search"
          name="q"
          type="search"
          defaultValue={query.q?.[0] ?? ""}
          maxLength={200}
          placeholder="Make, model, year, VIN, lot number or keyword"
        />
        <button type="submit" className="btn btn-primary">
          Search
        </button>
      </form>

      <div ref={bar} className="mt-3 flex flex-wrap items-center gap-2">
        {inBar.map((id) => {
          const filter = filterById(id);
          return visible(filter) ? (
            <Menu key={id} filter={filter} query={query} counts={countsOf(id)} apply={apply} onToggle={syncWanted} />
          ) : null;
        })}
        <button
          type="button"
          className="btn btn-outline"
          aria-haspopup="dialog"
          onClick={() => {
            panel.current?.showModal();
            syncWanted();
          }}
        >
          <span className="lg:hidden">Filters{active.length > 0 && ` · ${active.length}`}</span>
          <span className="hidden lg:inline">All filters{hidden > 0 && ` · ${hidden}`}</span>
        </button>
        <label className="mb-0 ml-auto flex items-center gap-2">
          Sort
          <select
            className="w-auto"
            value={query.sort?.[0] ?? "newest"}
            onChange={(event) => apply(edit(query, { sort: [event.target.value] }))}
          >
            {SORTS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <p aria-live="polite" className="mr-2 font-semibold">
          {lots(total)}
        </p>
        {found.map((chip) => (
          <button key={chip.key} type="button" className="chip" aria-label={`Remove ${chip.label}`} onClick={() => apply(chip.without)}>
            {chip.label} <span aria-hidden="true">✕</span>
          </button>
        ))}
        {found.length > 0 && (
          <button type="button" className="btn btn-link" onClick={() => apply(edit({}, { sort: query.sort ?? null }))}>
            Clear all
          </button>
        )}
      </div>

      <dialog ref={panel} className="filters-panel" aria-labelledby="all-filters" onClose={syncWanted}>
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 id="all-filters" className="text-xl font-semibold">
            All filters
          </h2>
          <button type="button" className="btn btn-ghost" aria-label="Close" onClick={() => panel.current?.close()}>
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {GROUPS.map((group) => {
            const shown = FILTERS.filter((filter) => filter.group === group.id && visible(filter));
            return (
              <section key={group.id} className="mb-6">
                <h3 className="mb-3 font-semibold">{group.label}</h3>
                {shown.map((filter) =>
                  filter.kind === "toggle" ? (
                    <div key={filter.id} className="mb-4">
                      <Control filter={filter} query={query} counts={countsOf(filter.id)} apply={apply} place="panel" />
                    </div>
                  ) : (
                    <fieldset key={filter.id} className="mb-4">
                      <legend>{filter.label}</legend>
                      <Control filter={filter} query={query} counts={countsOf(filter.id)} apply={apply} place="panel" />
                    </fieldset>
                  ),
                )}
              </section>
            );
          })}
        </div>
        <div className="border-t border-line px-5 py-4">
          <button type="button" className="btn btn-primary w-full" onClick={() => panel.current?.close()}>
            Show {lots(total)}
          </button>
        </div>
      </dialog>

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
  onToggle,
}: {
  filter: Filter;
  query: Query;
  counts: Counts;
  apply: Apply;
  onToggle: () => void;
}) {
  const chosen = filter.range ? Number(paramsOf(filter).some((param) => query[param])) : (query[filter.id]?.length ?? 0);
  return (
    <details
      className="filter-menu hidden lg:block"
      data-facet={COUNTED.includes(filter.id) ? filter.id : undefined}
      onToggle={onToggle}
    >
      <summary className="btn btn-outline">
        {filter.label}
        {chosen > 0 && <span className="font-normal">· {chosen}</span>}
        <span aria-hidden="true">▾</span>
      </summary>
      <div className="filter-menu-panel">
        <Control filter={filter} query={query} counts={counts} apply={apply} place="bar" />
      </div>
    </details>
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
      <Choice
        id={id}
        type="checkbox"
        label={filter.label}
        count={counts ? (counts.find((option) => option.value === "yes")?.count ?? 0) : undefined}
        checked={!!query[filter.id]}
        onChange={(on) => apply(edit(query, { [filter.id]: on ? ["1"] : null }))}
      />
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
      <select
        id={id}
        aria-label={filter.label}
        value={chosen[0] ?? ""}
        onChange={(event) => {
          const value = event.target.value;
          apply(edit(query, { [filter.id]: value ? [value] : null, ...(filter.id === "make" ? { model: null } : {}) }));
        }}
      >
        <option value="">Any {filter.label.toLowerCase()}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
            {option.count !== undefined && ` (${count.format(option.count)})`}
          </option>
        ))}
      </select>
    );
  }

  const single = filter.kind === "single";
  return (
    <ul className="flex flex-col gap-1">
      {single && (
        <li>
          <Choice id={`${id}-any`} type="radio" name={id} label="Any day" checked={!chosen.length} onChange={() => apply(edit(query, { [filter.id]: null }))} />
        </li>
      )}
      {options.map((option) => {
        const checked = chosen.includes(option.value);
        return (
          <li key={option.value}>
            <Choice
              id={`${id}-${option.value}`}
              type={single ? "radio" : "checkbox"}
              name={id}
              label={option.label}
              count={option.count}
              checked={checked}
              // Nothing to find there with the other filters: shown, so the list does not jump, but off.
              disabled={option.count === 0 && !checked}
              onChange={(on) => {
                const values = single ? [option.value] : on ? [...chosen, option.value] : chosen.filter((value) => value !== option.value);
                apply(edit(query, { [filter.id]: values }));
              }}
            />
          </li>
        );
      })}
      {!filter.options && counts === null && <li className="hint">Loading…</li>}
    </ul>
  );
}

function Choice({
  id,
  type,
  name,
  label,
  count: n,
  checked,
  disabled = false,
  onChange,
}: {
  id: string;
  type: "checkbox" | "radio";
  name?: string;
  label: string;
  count?: number;
  checked: boolean;
  disabled?: boolean;
  onChange: (on: boolean) => void;
}) {
  return (
    <label htmlFor={id} className={`mb-0 flex items-center gap-2 font-normal ${disabled ? "text-muted" : ""}`}>
      <input id={id} type={type} name={name} checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} />
      <span className="flex-1">{label}</span>
      {n !== undefined && <span className="text-sm text-muted tabular-nums">{count.format(n)}</span>}
    </label>
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
        <label key={param} htmlFor={`${id}-${param}`} className="mb-0 font-normal">
          {label}
          <input
            id={`${id}-${param}`}
            name={param}
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            defaultValue={query[param]?.[0] ?? ""}
            className="mt-1 w-32"
          />
        </label>
      ))}
      <button type="submit" className="btn btn-outline">
        Apply
      </button>
    </form>
  );
}
