// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { countries } from "@/lib/countries";

const actions = vi.hoisted(() => ({
  registerAction: vi.fn(),
  loginAction: vi.fn(),
  socialLoginAction: vi.fn(),
  resetPasswordAction: vi.fn(),
  verifyEmailAction: vi.fn(),
  forgotPasswordAction: vi.fn(),
  resendVerificationAction: vi.fn(),
}));
vi.mock("@/app/(auth)/actions", () => actions);

const { RegisterForm } = await import("@/components/auth/RegisterForm");
const { LoginForm } = await import("@/components/auth/LoginForm");
const { ForgotPasswordForm } = await import("@/components/auth/ForgotPasswordForm");
const { SocialButtons } = await import("@/components/auth/SocialButtons");
const { ResetPasswordForm } = await import("@/components/auth/ResetPasswordForm");

const COUNTRIES = countries().filter((c) => ["US", "FR", "GB"].includes(c.code));

beforeEach(() => {
  window.sessionStorage.clear();
});
afterEach(() => {
  cleanup();
  for (const fn of Object.values(actions)) fn.mockReset();
});

const type = (label: string, value: string) => fireEvent.input(screen.getByLabelText(label), { target: { value } });

function fillRegistration() {
  type("First name", "Dana");
  type("Last name", "Lee");
  type("Email", "dana@example.com");
  type("Password", "long-enough-pw1");
  fireEvent.click(screen.getByLabelText("I accept the Terms of Use and Privacy Policy"));
}

describe("RegisterForm", () => {
  it("keeps every value when the server rejects the form", async () => {
    // Regression: native form actions reset the form, so an API error cleared every field.
    actions.registerAction.mockResolvedValue({
      code: "validation",
      message: "Please correct the highlighted fields.",
      errors: { password: "This password appears in a known data breach." },
    });
    render(<RegisterForm countries={COUNTRIES} defaultCountry="US" />);
    fillRegistration();
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByText("This password appears in a known data breach.")).toBeTruthy();
    expect(screen.getByLabelText<HTMLInputElement>("First name").value).toBe("Dana");
    expect(screen.getByLabelText<HTMLInputElement>("Email").value).toBe("dana@example.com");
    expect(screen.getByLabelText<HTMLInputElement>("Password").value).toBe("long-enough-pw1");
    expect(screen.getByLabelText<HTMLInputElement>("I accept the Terms of Use and Privacy Policy").checked).toBe(true);
  });

  it("validates in the browser before calling the server", async () => {
    render(<RegisterForm countries={COUNTRIES} defaultCountry="US" />);
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(await screen.findByText("Enter your first name.")).toBeTruthy();
    expect(screen.getByText(/Accept the Terms of Use/)).toBeTruthy();
    expect(actions.registerAction).not.toHaveBeenCalled();
  });

  it("shows the password requirements only once the field has been focused", () => {
    render(<RegisterForm countries={COUNTRIES} defaultCountry="US" />);
    expect(screen.getByLabelText<HTMLSelectElement>("Country").value).toBe("US");
    expect(screen.queryByText(/At least 8 characters/)).toBeNull();
    fireEvent.focus(screen.getByLabelText("Password"));
    expect(screen.getByText(/• At least 8 characters/)).toBeTruthy();
    type("Password", "abcdefghijk1!");
    for (const rule of ["At least 8 characters", "At least one letter", "At least one number"]) {
      expect(screen.getByText(new RegExp(`✓ ${rule}`))).toBeTruthy();
    }
  });

  it("refuses a password missing a number, even with letters and a special character", async () => {
    render(<RegisterForm countries={COUNTRIES} defaultCountry="US" />);
    fillRegistration();
    type("Password", "long-enough-pw");
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(await screen.findByText("Add at least one number.")).toBeTruthy();
    expect(actions.registerAction).not.toHaveBeenCalled();
  });

  it("checks a field once the cursor leaves it", async () => {
    render(<RegisterForm countries={COUNTRIES} defaultCountry="US" />);
    const email = screen.getByLabelText("Email");
    fireEvent.input(email, { target: { value: "nope" } });
    fireEvent.blur(email);
    expect(await screen.findByText(/valid email address/)).toBeTruthy();
    expect(actions.registerAction).not.toHaveBeenCalled();
  });

  it("formats the number into the country's own shape as it is typed", () => {
    render(<RegisterForm countries={COUNTRIES} defaultCountry="US" />);
    const number = screen.getByLabelText<HTMLInputElement>("Number");
    type("Number", "20155");
    expect(number.value).toBe("(201) 55");
    type("Number", "2015550123");
    expect(number.value).toBe("(201) 555-0123");
    // The placeholder is the ceiling: nothing longer can be typed.
    expect(number.getAttribute("maxlength")).toBe("14");
    type("Number", "2015550123999");
    expect(number.value).toBe("(201) 555-0123");
  });

  it("caps what can be typed in the name and email fields", () => {
    render(<RegisterForm countries={COUNTRIES} defaultCountry="US" />);
    expect(screen.getByLabelText("First name").getAttribute("maxlength")).toBe("100");
    expect(screen.getByLabelText("Email").getAttribute("maxlength")).toBe("254");
  });

  it("refuses a number that does not fit the chosen country", async () => {
    render(<RegisterForm countries={COUNTRIES} defaultCountry="US" />);
    fillRegistration();
    type("Number", "201555");
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(await screen.findByText(/valid phone number/)).toBeTruthy();
    expect(actions.registerAction).not.toHaveBeenCalled();
  });

  it("picks the country the browser's time zone points to", async () => {
    const real = Intl.DateTimeFormat;
    vi.spyOn(Intl, "DateTimeFormat").mockImplementation(
      (...args: ConstructorParameters<typeof Intl.DateTimeFormat>) =>
        ({ ...new real(...args), resolvedOptions: () => ({ ...new real(...args).resolvedOptions(), timeZone: "Europe/Paris" }) }) as Intl.DateTimeFormat,
    );
    render(<RegisterForm countries={COUNTRIES} defaultCountry="US" />);
    await waitFor(() => expect(screen.getByLabelText<HTMLSelectElement>("Country").value).toBe("FR"));
    expect(screen.getByLabelText("Number").getAttribute("placeholder")).toBe("06 12 34 56 78");
    vi.mocked(Intl.DateTimeFormat).mockRestore();
  });

  it("confirms where the email went, links to sign in and stops remembering the address", async () => {
    actions.registerAction.mockResolvedValue({ ok: true });
    render(<RegisterForm countries={COUNTRIES} defaultCountry="US" />);
    fillRegistration();
    expect(window.sessionStorage.getItem("cs_email")).toBe("dana@example.com");
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(await screen.findByText("dana@example.com")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Go to sign in" }).getAttribute("href")).toBe("/login");
    expect(window.sessionStorage.getItem("cs_email")).toBe(null);
    // Nothing is left to register with: the account exists.
    expect(screen.queryByRole("button", { name: /Register with/ })).toBeNull();
    expect(screen.queryByText("or register with your email")).toBeNull();
  });

  it("offers Google and Apple above the email form", () => {
    render(<RegisterForm countries={COUNTRIES} defaultCountry="US" />);
    expect(screen.getByRole("button", { name: "Register with Google" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Register with Apple" })).toBeTruthy();
  });
});

describe("LoginForm", () => {
  it("has email, password, remember me and a forgot password link", () => {
    render(<LoginForm />);
    expect(screen.getByLabelText("Email").getAttribute("type")).toBe("email");
    expect(screen.getByLabelText("Password").getAttribute("autocomplete")).toBe("current-password");
    expect(screen.getByLabelText("Remember me").getAttribute("type")).toBe("checkbox");
    expect(screen.getByRole("link", { name: "Forgot your password?" }).getAttribute("href")).toBe("/forgot-password");
  });

  it("keeps the email, clears the wrong password and offers a reset", async () => {
    actions.loginAction.mockResolvedValue({ code: "invalid_credentials", message: "Incorrect email or password." });
    render(<LoginForm />);
    type("Email", "dana@example.com");
    type("Password", "wrong-password");
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByText(/Incorrect email or password\./)).toBeTruthy();
    expect(screen.getByLabelText<HTMLInputElement>("Email").value).toBe("dana@example.com");
    expect(screen.getByLabelText<HTMLInputElement>("Password").value).toBe("");
    expect(screen.getByRole("link", { name: "Reset your password" }).getAttribute("href")).toBe("/forgot-password");
  });

  it("links to a new confirmation email when the address is unconfirmed", async () => {
    actions.loginAction.mockResolvedValue({ code: "email_unverified", message: "Confirm your email first." });
    render(<LoginForm />);
    type("Email", "dana@example.com");
    type("Password", "whatever-password");
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByRole("link", { name: "Send a new confirmation link" })).toBeTruthy();
  });
});

describe("remembered email", () => {
  it("carries the address typed at sign in over to forgot password", async () => {
    const first = render(<LoginForm />);
    type("Email", "dana@example.com");
    first.unmount();
    render(<ForgotPasswordForm />);
    await waitFor(() => expect(screen.getByLabelText<HTMLInputElement>("Email").value).toBe("dana@example.com"));
  });

  it("does not carry over half an address", async () => {
    const first = render(<LoginForm />);
    type("Email", "dana@exa");
    first.unmount();
    render(<ForgotPasswordForm />);
    await waitFor(() => expect(screen.getByLabelText<HTMLInputElement>("Email")).toBeTruthy());
    expect(screen.getByLabelText<HTMLInputElement>("Email").value).toBe("");
  });

  it("focuses the password at sign in when the email is already known", async () => {
    window.sessionStorage.setItem("cs_email", "dana@example.com");
    render(<LoginForm />);
    await waitFor(() => expect(document.activeElement).toBe(screen.getByLabelText("Password")));
  });
});

describe("SocialButtons", () => {
  it("offers Google and Apple", () => {
    render(<SocialButtons intent="Register" />);
    expect(screen.getByRole("button", { name: "Register with Google" }).getAttribute("value")).toBe("google");
    expect(screen.getByRole("button", { name: "Register with Apple" }).getAttribute("value")).toBe("apple");
  });
});

describe("ResetPasswordForm", () => {
  it("sends the emailed token with the new password", async () => {
    actions.resetPasswordAction.mockResolvedValue({ ok: true });
    render(<ResetPasswordForm token="reset-tok" />);
    type("New password", "brand-new-password1");
    type("Confirm new password", "brand-new-password1");
    fireEvent.click(screen.getByRole("button", { name: "Change password" }));
    expect(await screen.findByRole("link", { name: "Sign in with your new password" })).toBeTruthy();
    expect(actions.resetPasswordAction).toHaveBeenCalledWith({
      token: "reset-tok",
      password: "brand-new-password1",
      password_confirm: "brand-new-password1",
    });
  });
});
