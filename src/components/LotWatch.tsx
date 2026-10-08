"use client";

import { BellIcon, BookmarkCheckIcon, BookmarkIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { saveLotAction, unsaveLotAction } from "@/app/[lang]/saved/actions";
import { useI18n } from "@/components/I18nProvider";
import { formatTime } from "@/components/LocalTime";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { cn } from "cn";
import { fill, LOCALES } from "@/lib/i18n";
import { browserZone } from "@/lib/lot-filters";
import type { Switches } from "@/lib/saved";

type WatchedLot = { source: string; lot_number: string; sale_at: string | null; buy_it_now_price: number | null };
type Reminder = "hour" | "day";

/** Each reminder, latest first, and how long before the auction's scheduled start it goes out. */
const BEFORE: Record<Reminder, number> = { hour: 3_600_000, day: 86_400_000 };
const REMINDERS = Object.keys(BEFORE) as Reminder[];
const field = (which: Reminder) => (which === "hour" ? "remind_hour" : "remind_day");

/** When a reminder goes out for an auction starting at `saleAt`. */
export const reminderTime = (saleAt: string, which: Reminder) => new Date(Date.parse(saleAt) - BEFORE[which]);

/** A reminder whose time has come by `now` is not scheduled: it never goes out. */
export const passed = (saleAt: string | null, which: Reminder, now: number) => !!saleAt && reminderTime(saleAt, which).getTime() <= now;

/**
 * Save / Saved for one lot, the auction listing itself. On the lot page and the Saved page (`full`)
 * also Remind me, the reminders' status, and alerts when the auction's date or Buy now price
 * changes, all offered once saved. Saving alone switches nothing on. `now` is the server's clock,
 * which says whether a set reminder's time has passed.
 */
export function LotWatch({
  lot,
  initial,
  full = false,
  refresh = false,
  now = 0,
  className,
}: {
  lot: WatchedLot;
  /** What the dealer switched on for the lot, or null while it is not saved. */
  initial: Switches | null;
  full?: boolean;
  /** Shows the page again once the lot is no longer saved, as the Saved page, which lists them, needs. */
  refresh?: boolean;
  now?: number;
  className?: string;
}) {
  const { m } = useI18n();
  const router = useRouter();
  const id = useId();
  const [state, setState] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const key = { source: lot.source, lot_number: lot.lot_number };

  /** Saves the lot with these switches; `then` runs once it is. */
  function save(changes: Partial<Switches>, then?: () => void) {
    setError(null);
    start(async () => {
      const result = await saveLotAction(key, changes, browserZone());
      if ("error" in result) return setError(result.error);
      const { change_alerts, remind_hour, remind_day } = result.value;
      setState({ change_alerts, remind_hour, remind_day });
      then?.();
    });
  }

  function unsave() {
    setError(null);
    start(async () => {
      const result = await unsaveLotAction(key);
      if ("error" in result) return setError(result.error);
      setState(null);
      if (refresh) router.refresh();
    });
  }

  const set = REMINDERS.filter((which) => state?.[field(which)]);
  const list = set.map((which) =>
    passed(lot.sale_at, which, now) ? fill(m.reminders.shortPassed, { reminder: m.reminders.short[which] }) : m.reminders.short[which],
  );

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          aria-pressed={!!state}
          disabled={pending}
          className="aria-pressed:bg-muted"
          onClick={() => (state ? unsave() : save({}))}
        >
          {state ? <BookmarkCheckIcon aria-hidden="true" /> : <BookmarkIcon aria-hidden="true" />}
          {state ? m.saved.saved : m.saved.save}
        </Button>
        {full && <RemindMe lot={lot} state={state} pending={pending} error={error} save={save} />}
      </div>
      {full && list.length > 0 && (
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <BellIcon aria-hidden="true" className="size-4 flex-none" />
          {fill(lot.sale_at ? m.reminders.status : m.reminders.statusWaiting, { list: list.join(", ") })}
        </p>
      )}
      {full && state && (
        <Field orientation="horizontal" className="w-auto">
          <Checkbox
            id={`${id}-changes`}
            checked={state.change_alerts}
            disabled={pending}
            onCheckedChange={(on) => save({ change_alerts: on })}
          />
          <FieldLabel htmlFor={`${id}-changes`} className="font-normal">
            {lot.buy_it_now_price ? m.saved.changeAlerts : m.saved.changeAlertsDate}
          </FieldLabel>
        </Field>
      )}
      {error && (
        <p role="alert" className="text-sm font-semibold text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * The reminders dialog: 1 hour before the auction's scheduled start (checked for a first choice)
 * and 1 day before, each at its time in the dealer's zone, or "Already passed" and off. Without a
 * start time yet, the reminders wait for one. Saving them saves the lot too, so with no time
 * chosen there is nothing to save, unless it turns off a reminder still to come.
 */
function RemindMe({
  lot,
  state,
  pending,
  error,
  save,
}: {
  lot: WatchedLot;
  state: Switches | null;
  pending: boolean;
  error: string | null;
  save: (changes: Partial<Switches>, then?: () => void) => void;
}) {
  const { locale, m } = useI18n();
  const words = m.reminders;
  const time = (value: string) => formatTime(value, LOCALES[locale].tag, "sale");
  const id = useId();
  const [open, setOpen] = useState(false);
  // The clock and the choice as the dialog opens: it renders only then, in the browser.
  const [now, setNow] = useState(0);
  const [choice, setChoice] = useState({ remind_hour: true, remind_day: false });

  const waiting = (which: Reminder, at: number) => !!state?.[field(which)] && !passed(lot.sale_at, which, at);
  const nothing = !choice.remind_hour && !choice.remind_day && !REMINDERS.some((which) => waiting(which, now));

  function toggle(next: boolean) {
    if (next) {
      const at = Date.now();
      // With no reminder still to come, the choice starts over: 1 hour before, checked.
      const fresh = !waiting("hour", at) && !waiting("day", at);
      setNow(at);
      setChoice({ remind_hour: fresh ? !passed(lot.sale_at, "hour", at) : waiting("hour", at), remind_day: waiting("day", at) });
    }
    setOpen(next);
  }

  return (
    <Dialog open={open} onOpenChange={toggle}>
      <DialogTrigger render={<Button variant="outline" />}>
        <BellIcon aria-hidden="true" />
        {words.button}
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>{words.title}</DialogTitle>
        <p>{lot.sale_at ? fill(words.starts, { time: time(lot.sale_at) }) : words.waiting}</p>
        <FieldSet className="gap-3">
          <FieldLegend className="sr-only">{words.title}</FieldLegend>
          {REMINDERS.map((which) => {
            const gone = passed(lot.sale_at, which, now);
            return (
              <Field key={which} orientation="horizontal" data-disabled={gone}>
                <Checkbox
                  id={`${id}-${which}`}
                  checked={choice[field(which)]}
                  disabled={gone}
                  onCheckedChange={(on) => setChoice({ ...choice, [field(which)]: on })}
                />
                <FieldLabel htmlFor={`${id}-${which}`} className="flex-col items-start gap-0 font-normal">
                  {words[which]}
                  {lot.sale_at && (
                    <span className="text-muted-foreground">
                      {gone ? words.passed : time(reminderTime(lot.sale_at, which).toISOString())}
                    </span>
                  )}
                </FieldLabel>
              </Field>
            );
          })}
        </FieldSet>
        <p className="text-muted-foreground">{words.note}</p>
        {!state && <p className="text-muted-foreground">{words.alsoSaves}</p>}
        {error && (
          <p role="alert" className="font-semibold text-destructive">
            {error}
          </p>
        )}
        <Button type="button" size="lg" disabled={pending || nothing} onClick={() => save(choice, () => setOpen(false))}>
          {words.submit}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
