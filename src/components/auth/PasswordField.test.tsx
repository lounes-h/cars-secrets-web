// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PasswordField } from "@/components/auth/PasswordField";

afterEach(cleanup);

const registration = { name: "password", onChange: vi.fn(), onBlur: vi.fn(), ref: vi.fn() };

describe("PasswordField", () => {
  it("hides the password until the toggle is pressed", () => {
    render(<PasswordField registration={registration} autoComplete="current-password" />);
    const input = screen.getByLabelText("Password");
    expect(input.getAttribute("type")).toBe("password");
    const toggle = screen.getByRole("button", { name: "Show password" });
    expect(toggle.getAttribute("type")).toBe("button");
    fireEvent.click(toggle);
    expect(input.getAttribute("type")).toBe("text");
    expect(screen.getByRole("button", { name: "Hide password" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("warns when Caps Lock is on", () => {
    render(<PasswordField registration={registration} autoComplete="current-password" />);
    const input = screen.getByLabelText("Password");
    fireEvent.keyUp(input, { key: "A", modifierCapsLock: true });
    expect(screen.getByText("Caps Lock is on.")).toBeTruthy();
    fireEvent.blur(input);
    expect(screen.queryByText("Caps Lock is on.")).toBeNull();
    expect(registration.onBlur).toHaveBeenCalled();
  });

  it("ticks each requirement as the password meets it, and mentions no breach list", () => {
    const { rerender } = render(
      <PasswordField registration={registration} autoComplete="new-password" requirementFor="abcdefghijk" />,
    );
    expect(screen.getByText(/✓ At least 10 characters \(11\/10\)/)).toBeTruthy();
    expect(screen.getByText(/• At least one special character/)).toBeTruthy();
    expect(screen.queryByText(/data breach/)).toBeNull();
    rerender(<PasswordField registration={registration} autoComplete="new-password" requirementFor="abcdefghij!" />);
    expect(screen.getByText(/✓ At least one special character/)).toBeTruthy();
  });

  it("links its error message to the input", () => {
    render(<PasswordField registration={registration} autoComplete="new-password" error="Too short." />);
    const input = screen.getByLabelText("Password");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(document.getElementById(input.getAttribute("aria-describedby")!)?.textContent).toBe("Too short.");
  });
});
