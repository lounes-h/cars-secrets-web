import { countries } from "@/lib/countries";

/** Country (flag, name, calling code) + national number; the action joins them. */
export function PhoneField({ defaultCountry = "US" }: { defaultCountry?: string }) {
  return (
    <fieldset>
      <legend>
        Phone number <span className="hint font-normal">(optional)</span>
      </legend>
      <div className="grid grid-cols-[minmax(0,11rem)_1fr] gap-2">
        <label htmlFor="phone_country" className="sr-only">
          Country
        </label>
        <select id="phone_country" name="phone_country" defaultValue={defaultCountry} autoComplete="tel-country-code">
        {countries().map((country) => (
          <option key={country.code} value={country.code}>
            {country.flag} {country.name} (+{country.dialCode})
          </option>
        ))}
        </select>
        <label htmlFor="phone_number" className="sr-only">
          Number
        </label>
        <input
          id="phone_number"
          name="phone_number"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder="Number"
        />
      </div>
    </fieldset>
  );
}
