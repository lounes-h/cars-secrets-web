import type { ChangeEvent } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { FieldError } from "@/components/auth/FieldError";
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
  const current = countries.find((c) => c.code === (selected || defaultCountry)) ?? countries[0];

  // ponytail: reformatting puts the caret at the end, which only shows when editing mid-number.
  // A caret-preserving version is worth it the day anyone complains.
  const format = (event: ChangeEvent<HTMLInputElement>) => {
    event.target.value = formatNational(current.example, event.target.value, current.dialCode);
    return number.onChange(event);
  };

  return (
    <div>
      <label htmlFor="phone_number">
        Phone number <span className="hint font-normal">(optional)</span>
      </label>
      <div className="phone-field" data-invalid={error ? true : undefined}>
        <span className="phone-field-country">
          <span aria-hidden="true">
            {current.flag} +{current.dialCode}
          </span>
          <label htmlFor="phone_country" className="sr-only">
            Country
          </label>
          <select id="phone_country" autoComplete="tel-country-code" defaultValue={defaultCountry} {...country}>
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.name} (+{c.dialCode})
              </option>
            ))}
          </select>
        </span>
        <label htmlFor="phone_number" className="sr-only">
          Number
        </label>
        <input
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
      </div>
      <FieldError id="phone_number-error" message={error} />
    </div>
  );
}
