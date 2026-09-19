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

const COUNTRIES = countries().slice(0, 5).concat(countries().filter((c) => c.code === "US"));

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
  type("Password", "long-enough-pw");
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
    expect(screen.getByLabelText<HTMLInputElement>("Password").value).toBe("long-enough-pw");
    expect(screen.getByLabelText<HTMLInputElement>("I accept the Terms of Use and Privacy Policy").checked).toBe(true);
  });

  it("validates in the browser before calling the server", async () => {
    render(<RegisterForm countries={COUNTRIES} defaultCountry="US" />);
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(await screen.findByText("Enter your first name.")).toBeTruthy();
    expect(screen.getByText(/Accept the Terms of Use/)).toBeTruthy();
    expect(actions.registerAction).not.toHaveBeenCalled();
  });

  it("shows the live password requirement and the default country", () => {
    render(<RegisterForm countries={COUNTRIES} defaultCountry="US" />);
    expect(screen.getByLabelText<HTMLSelectElement>("Country").value).toBe("US");
    expect(screen.getByText(/At least 10 characters \(0\/10\)/)).toBeTruthy();
    type("Password", "abcdefghijk");
    expect(screen.getByText(/✓ At least 10 characters \(11\/10\)/)).toBeTruthy();
  });

  it("confirms where the email went and links to sign in", async () => {
    actions.registerAction.mockResolvedValue({ ok: true });
    render(<RegisterForm countries={COUNTRIES} defaultCountry="US" />);
    fillRegistration();
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(await screen.findByText("dana@example.com")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Go to sign in" }).getAttribute("href")).toBe("/login");
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
    type("New password", "brand-new-password");
    type("Confirm new password", "brand-new-password");
    fireEvent.click(screen.getByRole("button", { name: "Change password" }));
    expect(await screen.findByRole("link", { name: "Sign in with your new password" })).toBeTruthy();
    expect(actions.resetPasswordAction).toHaveBeenCalledWith({
      token: "reset-tok",
      password: "brand-new-password",
      password_confirm: "brand-new-password",
    });
  });
});
