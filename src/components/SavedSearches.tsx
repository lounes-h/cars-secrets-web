"use client";

import { CheckIcon, ChevronDownIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactElement, type ReactNode, useId, useState, useTransition } from "react";
import { deleteSearchAction, saveSearchAction, updateSearchAction } from "@/app/[lang]/saved/actions";
import { useI18n } from "@/components/I18nProvider";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { fill, localePath } from "@/lib/i18n";
import { browserZone, listPath, type Query, readQuery, SEARCH_NAME_MAX, searchName, searchQuery } from "@/lib/lot-filters";
import type { SavedSearch } from "@/lib/saved";

/**
 * Save search, as text like Clear all, under the search input while a filter is set. While
 * the filters on screen are a saved search's it reads "Edit search", to rename it or pause its
 * alerts; while the dealer edits one (`editing`, the list's `saved` parameter) and the filters
 * differ, "Save changes", to save them into it or as a new search.
 */
export function SaveSearch({ query, searches, editing }: { query: Query; searches: SavedSearch[]; editing: SavedSearch | null }) {
  const { locale, m } = useI18n();
  const words = m.searches;
  const router = useRouter();
  const filters = searchQuery(query);
  const same = editing ?? searches.find((search) => search.query === filters) ?? null;
  const changed = !!same && same.query !== filters;
  const saved = !!same && !changed;
  return (
    <SearchForm
      search={same}
      query={saved ? null : filters}
      name={same?.name ?? searchName(query, { locale, m })}
      trigger={<Button variant="link" size="sm" />}
      label={changed ? words.saveChanges : saved ? words.edit : words.save}
      // A new search made while editing another leaves that one: the list stops editing it.
      onDone={(created) => (created && editing ? router.push(localePath(listPath(query), locale)) : router.refresh())}
    />
  );
}

/** The dealer's saved searches beside Save search, each opening its lots; the one on screen is marked. */
export function SearchesMenu({ query, searches }: { query: Query; searches: SavedSearch[] }) {
  const { locale, m } = useI18n();
  const filters = searchQuery(query);
  if (!searches.length) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="link" size="sm" />}>
        {m.searches.mine}
        <ChevronDownIcon aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72">
        {searches.map((search) => {
          const current = search.query === filters;
          const href = localePath(listPath(readQuery(new URLSearchParams(search.query))), locale);
          return (
            <DropdownMenuItem key={search.id} render={<Link href={href} aria-current={current ? "true" : undefined} />}>
              <span className="min-w-0 flex-1 truncate">{search.name}</span>
              {current && <CheckIcon aria-hidden="true" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * A search's name and alerts, in a dialog. Creates a search when there is none, or changes it:
 * its name and alerts, and its filters too when `query` brings new ones, which can also be saved
 * as a new search instead.
 */
function SearchForm({
  search,
  query,
  name,
  trigger,
  label,
  onDone,
}: {
  search: SavedSearch | null;
  /** The filters to save, as the list's query string; null keeps the search's own. */
  query: string | null;
  name: string;
  trigger: ReactElement;
  label: ReactNode;
  /** Runs once saved; `created` says a new search was made. */
  onDone: (created: boolean) => void;
}) {
  const words = useI18n().m.searches;
  const id = useId();
  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function toggle(next: boolean) {
    if (next) {
      setAlerts(search?.alerts ?? false);
      setError(null);
    }
    setOpen(next);
  }

  function submit(form: HTMLFormElement, asNew: boolean) {
    const typed = String(new FormData(form).get("name") ?? "").trim();
    if (!typed) return;
    setError(null);
    start(async () => {
      const result =
        search && !asNew
          ? await updateSearchAction(search.id, { name: typed, ...(query !== null && { query }), alerts }, browserZone())
          : await saveSearchAction({ name: typed, query: query ?? "", alerts }, browserZone());
      if ("error" in result) return setError(result.error);
      setOpen(false);
      onDone(!search || asNew);
    });
  }

  return (
    <Dialog open={open} onOpenChange={toggle}>
      <DialogTrigger render={trigger}>{label}</DialogTrigger>
      <DialogContent>
        <DialogTitle>{search ? words.editTitle : words.createTitle}</DialogTitle>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            submit(event.currentTarget, false);
          }}
        >
          <Field>
            <FieldLabel htmlFor={`${id}-name`}>{words.name}</FieldLabel>
            <Input id={`${id}-name`} name="name" defaultValue={name} maxLength={SEARCH_NAME_MAX} required />
          </Field>
          <Field orientation="horizontal" className="items-start">
            <Checkbox id={`${id}-alerts`} checked={alerts} onCheckedChange={(on) => setAlerts(on)} className="mt-0.5" />
            <div className="flex flex-col gap-1">
              <FieldLabel htmlFor={`${id}-alerts`} className="font-normal">
                {words.alerts}
              </FieldLabel>
              <FieldDescription>{words.alertsNote}</FieldDescription>
            </div>
          </Field>
          {error && (
            <p role="alert" className="font-semibold text-destructive">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button type="submit" size="lg" disabled={pending}>
              {search ? words.update : words.create}
            </Button>
            {search && query !== null && (
              <Button type="button" variant="outline" size="lg" disabled={pending} onClick={(event) => submit(event.currentTarget.form!, true)}>
                {words.saveAsNew}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** One saved search's controls on the Saved page: its alerts, its filters on the lot list, its name, deleting it. */
export function SearchControls({ search }: { search: SavedSearch }) {
  const { locale, m } = useI18n();
  const words = m.searches;
  const router = useRouter();
  const id = useId();
  const [alerts, setAlerts] = useState(search.alerts);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function switchAlerts(on: boolean) {
    setError(null);
    start(async () => {
      const result = await updateSearchAction(search.id, { alerts: on }, browserZone());
      if ("error" in result) return setError(result.error);
      setAlerts(on);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <Field orientation="horizontal" className="w-auto">
        <Checkbox id={`${id}-alerts`} checked={alerts} disabled={pending} onCheckedChange={switchAlerts} />
        <FieldLabel htmlFor={`${id}-alerts`} className="font-normal">
          {words.alerts}
        </FieldLabel>
      </Field>
      <div className="flex flex-wrap gap-2">
        <Link
          href={localePath(listPath(readQuery(new URLSearchParams(search.query)), 1, search.id), locale)}
          className={buttonVariants({ variant: "outline" })}
        >
          {words.editFilters}
        </Link>
        <SearchForm
          search={search}
          query={null}
          name={search.name}
          trigger={<Button variant="outline" />}
          label={words.rename}
          onDone={() => router.refresh()}
        />
        <DeleteSearch search={search} />
      </div>
      {error && (
        <p role="alert" className="text-sm font-semibold text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

/** Delete, once the dealer confirms: the search's alerts stop, lots saved on their own stay. */
function DeleteSearch({ search }: { search: SavedSearch }) {
  const words = useI18n().m.searches;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function remove() {
    setError(null);
    start(async () => {
      const result = await deleteSearchAction(search.id);
      if ("error" in result) return setError(result.error);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>{words.delete}</DialogTrigger>
      <DialogContent>
        <DialogTitle>{fill(words.deleteTitle, { name: search.name })}</DialogTitle>
        <p>{words.deleteNote}</p>
        {error && (
          <p role="alert" className="font-semibold text-destructive">
            {error}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="lg" disabled={pending} onClick={remove}>
            {words.confirmDelete}
          </Button>
          <Button type="button" variant="outline" size="lg" onClick={() => setOpen(false)}>
            {words.cancel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
