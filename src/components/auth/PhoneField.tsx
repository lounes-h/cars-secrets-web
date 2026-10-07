"use client";

import type { ChangeEvent } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { ChevronDownIcon } from "lucide-react";
import { useI18n } from "@/components/I18nProvider";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
import { formatNational, type Country } from "@/lib/countries";

type Props = {
  /** Built on the server, so names match between server and browser. */
  countries: Country[];
  country: UseFormRegisterReturn;
  number: UseFormRegisterReturn;
  /** Also rendered on the server, so the right country shows before the page is interactive. */
  defaultCountry: string;
  /** The country currently picked, for the flag, the calling code and the placeholder. */
  selected?: string;
  error?: string;
};

/**
 * Country and national number in one control: the flag and calling code sit inside the field,
 * with the country <select> laid over them so the picker stays native. The action joins the two.
 */
export function PhoneField({ countries, country, number, defaultCountry, selected, error }: Props) {
  const words = useI18n().m.auth.phoneField;
  const current = countries.find((c) => c.code === (selected || defaultCountry)) ?? countries[0];

  // ponytail: reformatting puts the caret at the end, which only shows when editing mid-number.
  // A caret-preserving version is worth it the day anyone complains.
  const format = (event: ChangeEvent<HTMLInputElement>) => {
    event.target.value = formatNational(current.example, event.target.value, current.dialCode);
    return number.onChange(event);
  };

  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor="phone_number">
        {words.label} <span className="font-normal text-muted-foreground">{words.optional}</span>
      </FieldLabel>
      <InputGroup>
        <span className="relative flex h-full items-center gap-1 pl-3 text-sm whitespace-nowrap">
          <span aria-hidden="true">
            {current.flag} +{current.dialCode}
          </span>
          <ChevronDownIcon aria-hidden="true" className="size-4 text-muted-foreground" />
          <label htmlFor="phone_country" className="sr-only">
            {words.country}
          </label>
          {/* The native picker, laid over the flag and calling code so only they show. Its slot
              lets the group draw the focus ring around both parts. */}
          <select
            id="phone_country"
            data-slot="input-group-control"
            autoComplete="tel-country-code"
            defaultValue={defaultCountry}
            className="absolute inset-0 cursor-pointer opacity-0"
            {...country}
          >
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.name} (+{c.dialCode})
              </option>
            ))}
          </select>
        </span>
        <label htmlFor="phone_number" className="sr-only">
          {words.number}
        </label>
        <InputGroupInput
          id="phone_number"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder={current.example}
          // Long enough for an international paste ("+1 (551) 358-8130"); format() is the real ceiling.
          maxLength={`+${current.dialCode} ${current.example}`.length}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "phone_number-error" : undefined}
          {...number}
          onChange={format}
        />
      </InputGroup>
      <FieldError id="phone_number-error">{error}</FieldError>
    </Field>
  );
}
