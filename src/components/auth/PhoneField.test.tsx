// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PhoneField } from "@/components/auth/PhoneField";

afterEach(cleanup);

describe("PhoneField", () => {
  it("offers every country with its flag and calling code, US by default", () => {
    render(<PhoneField />);
    const select = screen.getByLabelText<HTMLSelectElement>("Country");
    expect(select.value).toBe("US");
    expect(select.options.length).toBeGreaterThan(240);
    expect(screen.getByRole("option", { name: "🇫🇷 France (+33)" })).toBeTruthy();
    expect(screen.getByLabelText("Number").getAttribute("type")).toBe("tel");
    expect(screen.getByLabelText("Number").hasAttribute("required")).toBe(false);
  });
});
