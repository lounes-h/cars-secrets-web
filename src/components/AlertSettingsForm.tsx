"use client";

import { type FormEvent, useId, useState, useTransition } from "react";
import { saveAlertSettingsAction } from "@/app/[lang]/settings/actions";
import { useI18n } from "@/components/I18nProvider";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldDescription, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { ChosenSettings } from "@/lib/alerts";
import { type Locale, LOCALE_LIST, LOCALES } from "@/lib/i18n";

/**
 * Which alerts are emailed, how often the search summary comes, and the language and zone of the
 * emails. Every alert reaches the Alerts page whatever is chosen here.
 */
export function AlertSettingsForm({ initial, zones }: { initial: ChosenSettings; zones: string[] }) {
  const words = useI18n().m.settings;
  const id = useId();
  const [values, setValues] = useState(initial);
  const [outcome, setOutcome] = useState<{ error: string } | { saved: string } | null>(null);
  const [pending, start] = useTransition();

  function set(changes: Partial<ChosenSettings>) {
    setValues({ ...values, ...changes });
    setOutcome(null);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    start(async () => {
      const result = await saveAlertSettingsAction(values);
      setOutcome("error" in result ? result : { saved: words.saved });
    });
  }

  const emails = [
    ["email_matches", words.matches],
    ["email_changes", words.changes],
    ["email_reminders", words.reminders],
  ] as const;

  return (
    <form onSubmit={submit} className="flex flex-col gap-8">
      <FieldSet>
        <FieldLegend>{words.emailMe}</FieldLegend>
        {emails.map(([name, label]) => (
          <Field key={name} orientation="horizontal">
            <Checkbox id={`${id}-${name}`} checked={values[name]} onCheckedChange={(on) => set({ [name]: on })} />
            <FieldLabel htmlFor={`${id}-${name}`} className="font-normal">
              {label}
            </FieldLabel>
          </Field>
        ))}
      </FieldSet>
      <FieldSet>
        <FieldLegend>{words.summary}</FieldLegend>
        <RadioGroup value={values.twice_daily ? "twice" : "once"} onValueChange={(value) => set({ twice_daily: value === "twice" })}>
          {(["once", "twice"] as const).map((value) => (
            <Field key={value} orientation="horizontal">
              <RadioGroupItem id={`${id}-${value}`} value={value} />
              <FieldLabel htmlFor={`${id}-${value}`} className="font-normal">
                {words[value]}
              </FieldLabel>
            </Field>
          ))}
        </RadioGroup>
      </FieldSet>
      <FieldSet>
        <FieldLegend>{words.language}</FieldLegend>
        <RadioGroup value={values.locale} onValueChange={(value) => set({ locale: value as Locale })}>
          {LOCALE_LIST.map((lang) => (
            <Field key={lang} orientation="horizontal">
              <RadioGroupItem id={`${id}-${lang}`} value={lang} />
              <FieldLabel htmlFor={`${id}-${lang}`} lang={LOCALES[lang].tag} className="font-normal">
                {LOCALES[lang].label}
              </FieldLabel>
            </Field>
          ))}
        </RadioGroup>
      </FieldSet>
      <Field className="max-w-md">
        <FieldLabel htmlFor={`${id}-zone`}>{words.timeZone}</FieldLabel>
        <NativeSelect id={`${id}-zone`} className="w-full" value={values.time_zone} onChange={(event) => set({ time_zone: event.target.value })}>
          {zones.map((zone) => (
            <NativeSelectOption key={zone} value={zone}>
              {zone.replaceAll("_", " ")}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <FieldDescription>{words.timeZoneNote}</FieldDescription>
      </Field>
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" size="lg" disabled={pending}>
          {words.save}
        </Button>
        {outcome && "saved" in outcome && <p role="status">{outcome.saved}</p>}
        {outcome && "error" in outcome && (
          <p role="alert" className="font-semibold text-destructive">
            {outcome.error}
          </p>
        )}
      </div>
    </form>
  );
}
