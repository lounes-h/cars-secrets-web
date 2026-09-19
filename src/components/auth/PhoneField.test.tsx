// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PhoneField } from "@/components/auth/PhoneField";
import { countries } from "@/lib/countries";

afterEach(cleanup);

const field = (name: string) => ({ name, onChange: vi.fn(), onBlur: vi.fn(), ref: vi.fn() });

describe("PhoneField", () => {
  it("offers every country with its flag and calling code, preselecting the default", () => {
    render(
      <PhoneField countries={countries()} country={field("phone_country")} number={field("phone_number")} defaultCountry="FR" />,
    );
    expect(screen.getByLabelText<HTMLSelectElement>("Country").value).toBe("FR");
    const select = screen.getByLabelText<HTMLSelectElement>("Country");
    expect(select.options.length).toBeGreaterThan(240);
    expect(screen.getByRole("option", { name: "🇫🇷 France (+33)" })).toBeTruthy();
    expect(screen.getByLabelText("Number").getAttribute("type")).toBe("tel");
  });

  it("shows its error under the number", () => {
    render(
      <PhoneField countries={countries()} country={field("phone_country")} number={field("phone_number")} defaultCountry="US" error="Digits only." />,
    );
    expect(screen.getByLabelText("Number").getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByText("Digits only.")).toBeTruthy();
  });
});
