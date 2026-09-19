import { countries } from "@/lib/countries";

/** Country (flag, name, calling code) + national number; the action joins them. */
export function PhoneField({ defaultCountry = "US" }: { defaultCountry?: string }) {
  return (
    <fieldset>
      <legend>Phone number (optional)</legend>
      <label htmlFor="phone_country">Country</label>
      <select id="phone_country" name="phone_country" defaultValue={defaultCountry} autoComplete="tel-country-code">
        {countries().map((country) => (
          <option key={country.code} value={country.code}>
            {country.flag} {country.name} (+{country.dialCode})
          </option>
        ))}
      </select>
      <label htmlFor="phone_number">Number</label>
      <input id="phone_number" name="phone_number" type="tel" inputMode="tel" autoComplete="tel-national" />
    </fieldset>
  );
}
