import type { UseFormRegisterReturn } from "react-hook-form";
import { FieldError } from "@/components/auth/FieldError";
import type { Country } from "@/lib/countries";

type Props = {
  /** Built on the server, so names match between server and browser. */
  countries: Country[];
  country: UseFormRegisterReturn;
  number: UseFormRegisterReturn;
  /** Also rendered on the server, so the right country shows before the page is interactive. */
  defaultCountry: string;
  error?: string;
};

/** Country (flag, name, calling code) + national number; the action joins them. */
export function PhoneField({ countries, country, number, defaultCountry, error }: Props) {
  return (
    <fieldset>
      <legend>
        Phone number <span className="hint font-normal">(optional)</span>
      </legend>
      <div className="grid grid-cols-[minmax(0,11rem)_1fr] gap-2">
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
        <label htmlFor="phone_number" className="sr-only">
          Number
        </label>
        <input
          id="phone_number"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder="Number"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "phone_number-error" : undefined}
          {...number}
        />
      </div>
      <FieldError id="phone_number-error" message={error} />
    </fieldset>
  );
}
