// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PasswordField } from "@/components/auth/PasswordField";

afterEach(cleanup);

describe("PasswordField", () => {
  it("hides the password until the toggle is pressed", () => {
    render(<PasswordField autoComplete="current-password" />);
    const input = screen.getByLabelText("Password");
    expect(input.getAttribute("type")).toBe("password");
    const toggle = screen.getByRole("button", { name: "Show password" });
    expect(toggle.getAttribute("type")).toBe("button");
    fireEvent.click(toggle);
    expect(input.getAttribute("type")).toBe("text");
    expect(screen.getByRole("button", { name: "Hide password" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("links its error message to the input", () => {
    render(<PasswordField autoComplete="new-password" error="Too short." />);
    const input = screen.getByLabelText("Password");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(document.getElementById(input.getAttribute("aria-describedby")!)?.textContent).toBe("Too short.");
  });
});
