// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
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
const { VerifyEmailForm, RESEND_SECONDS } = await import("@/components/auth/VerifyEmailForm");
const { ResendVerificationForm } = await import("@/components/auth/ResendVerificationForm");

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
    fireEvent.click(screen.getByRole("button", { name: "Agree and register" }));

    expect(await screen.findByText("This password appears in a known data breach.")).toBeTruthy();
    expect(screen.getByLabelText<HTMLInputElement>("First name").value).toBe("Dana");
    expect(screen.getByLabelText<HTMLInputElement>("Email").value).toBe("dana@example.com");
    expect(screen.getByLabelText<HTMLInputElement>("Password").value).toBe("long-enough-pw1");
  });

  it("states the agreement on the button instead of asking for a checkbox", () => {
    render(<RegisterForm countries={COUNTRIES} defaultCountry="US" />);
    expect(screen.getByText(/I agree to the Terms of Use and Privacy Policy/)).toBeTruthy();
    expect(screen.queryByRole("checkbox")).toBeNull();
  });

  it("validates in the browser before calling the server", async () => {
    render(<RegisterForm countries={COUNTRIES} defaultCountry="US" />);
    fireEvent.click(screen.getByRole("button", { name: "Agree and register" }));
    expect(await screen.findByText("Enter your first name.")).toBeTruthy();
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
    fireEvent.click(screen.getByRole("button", { name: "Agree and register" }));
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
    // Formatting is the ceiling: nothing longer than the placeholder survives.
    type("Number", "2015550123999");
    expect(number.value).toBe("(201) 555-0123");
    // maxlength still lets a pasted international number in, so it can be reformatted.
    expect(number.getAttribute("maxlength")).toBe("17");
    type("Number", "+1 (551) 358-8130");
    expect(number.value).toBe("(551) 358-8130");
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
    fireEvent.click(screen.getByRole("button", { name: "Agree and register" }));
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

  it("asks for the emailed code in place of the form, and keeps the address remembered", async () => {
    actions.registerAction.mockResolvedValue({ ok: true });
    render(<RegisterForm countries={COUNTRIES} defaultCountry="US" />);
    fillRegistration();
    fireEvent.click(screen.getByRole("button", { name: "Agree and register" }));
    expect(await screen.findByLabelText("Confirmation code")).toBeTruthy();
    expect(screen.getByText("dana@example.com")).toBeTruthy();
    // /verify-email still needs it until the code is entered.
    expect(window.sessionStorage.getItem("cs_email")).toBe("dana@example.com");
    // Nothing is left to register with: the account exists.
    expect(screen.queryByRole("button", { name: /Register with/ })).toBeNull();
    expect(screen.queryByText("or register with your email")).toBeNull();
  });

  it("goes back to the filled-in form to correct the address", async () => {
    actions.registerAction.mockResolvedValue({ ok: true });
    render(<RegisterForm countries={COUNTRIES} defaultCountry="US" />);
    fillRegistration();
    fireEvent.click(screen.getByRole("button", { name: "Agree and register" }));
    fireEvent.click(await screen.findByRole("button", { name: "Use a different email" }));
    expect(screen.getByLabelText<HTMLInputElement>("Email").value).toBe("dana@example.com");
    expect(screen.getByLabelText<HTMLInputElement>("First name").value).toBe("Dana");
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

  it("keeps the email and clears the wrong password, without repeating the reset link", async () => {
    actions.loginAction.mockResolvedValue({ code: "invalid_credentials", message: "Incorrect email or password." });
    render(<LoginForm />);
    type("Email", "dana@example.com");
    type("Password", "wrong-password");
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByText(/Incorrect email or password\./)).toBeTruthy();
    expect(screen.getByLabelText<HTMLInputElement>("Email").value).toBe("dana@example.com");
    expect(screen.getByLabelText<HTMLInputElement>("Password").value).toBe("");
    // The form already carries "Forgot your password?"; the error does not repeat it.
    expect(screen.queryByRole("link", { name: "Reset your password" })).toBeNull();
  });

  it("asks for the emailed code when the address is unconfirmed, keeping remember me", async () => {
    actions.loginAction.mockResolvedValue({ code: "email_unverified", message: "Confirm your email first." });
    actions.verifyEmailAction.mockResolvedValue(undefined);
    render(<LoginForm />);
    type("Email", "dana@example.com");
    type("Password", "whatever-password");
    fireEvent.click(screen.getByLabelText("Remember me"));
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByText("Confirm your email address to finish signing in.")).toBeTruthy();
    type("Confirmation code", "123456");
    await waitFor(() =>
      expect(actions.verifyEmailAction).toHaveBeenCalledWith({ email: "dana@example.com", code: "123456", remember: true }),
    );
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

describe("VerifyEmailForm", () => {
  it("is a single numeric field the phone can autofill from the email", async () => {
    render(<VerifyEmailForm email="dana@example.com" />);
    const input = screen.getByLabelText("Confirmation code");
    expect(input.getAttribute("autocomplete")).toBe("one-time-code");
    expect(input.getAttribute("inputmode")).toBe("numeric");
    // A maxLength would cut "123 456" before the space is dropped.
    expect(input.hasAttribute("maxlength")).toBe(false);
    await waitFor(() => expect(document.activeElement).toBe(input));
  });

  it("keeps only the digits of a paste and sends them as soon as there are six", async () => {
    actions.verifyEmailAction.mockResolvedValue(undefined);
    render(<VerifyEmailForm email="dana@example.com" />);
    type("Confirmation code", "042 9");
    expect(screen.getByLabelText<HTMLInputElement>("Confirmation code").value).toBe("0429");
    expect(actions.verifyEmailAction).not.toHaveBeenCalled();
    type("Confirmation code", "042-917");
    await waitFor(() =>
      expect(actions.verifyEmailAction).toHaveBeenCalledWith({ email: "dana@example.com", code: "042917", remember: false }),
    );
    expect(actions.verifyEmailAction).toHaveBeenCalledTimes(1);
  });

  it("clears a wrong code and says so on the field", async () => {
    actions.verifyEmailAction.mockResolvedValue({ code: "invalid_code", message: "That code is incorrect or has expired." });
    render(<VerifyEmailForm email="dana@example.com" />);
    type("Confirmation code", "111111");
    expect(await screen.findByText("That code is incorrect or has expired.")).toBeTruthy();
    const input = screen.getByLabelText<HTMLInputElement>("Confirmation code");
    expect(input.value).toBe("");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    // The address is remembered again for /verify-email, since the dealer is not signed in.
    expect(window.sessionStorage.getItem("cs_email")).toBe("dana@example.com");
  });

  it("forgets the remembered address when the code is sent", async () => {
    window.sessionStorage.setItem("cs_email", "dana@example.com");
    actions.verifyEmailAction.mockReturnValue(new Promise(() => {})); // the redirect never returns
    render(<VerifyEmailForm email="dana@example.com" />);
    type("Confirmation code", "123456");
    await waitFor(() => expect(window.sessionStorage.getItem("cs_email")).toBe(null));
  });

  it("counts the wait in real time, even when a background tab slowed its timers", async () => {
    // Regression: the countdown counted ticks, so it fell behind while the dealer read their mail.
    vi.useFakeTimers();
    try {
      render(<VerifyEmailForm email="dana@example.com" />);
      vi.setSystemTime(Date.now() + RESEND_SECONDS * 1000);
      await act(() => vi.advanceTimersByTime(1000)); // one late tick after a minute away
      expect(screen.getByRole("button", { name: "Send a new code" })).toBeTruthy();
    } finally {
      vi.useRealTimers();
    }
  });

  it("offers a new code only after the wait, then restarts it", async () => {
    vi.useFakeTimers();
    try {
      actions.resendVerificationAction.mockResolvedValue({ ok: true });
      render(<VerifyEmailForm email="dana@example.com" />);
      expect(screen.queryByRole("button", { name: "Send a new code" })).toBeNull();
      expect(screen.getByText(/ask for a new code in 60 s/)).toBeTruthy();
      for (let s = 0; s < RESEND_SECONDS; s++) await act(() => vi.advanceTimersByTime(1000));
      await act(async () => fireEvent.click(screen.getByRole("button", { name: "Send a new code" })));
      expect(actions.resendVerificationAction).toHaveBeenCalledWith({ email: "dana@example.com", captcha_token: "" });
      expect(screen.getByText("We sent a new code to dana@example.com. Use the newest one.")).toBeTruthy();
      expect(screen.queryByRole("button", { name: "Send a new code" })).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("ResendVerificationForm", () => {
  it("asks for the address, then for its code", async () => {
    actions.resendVerificationAction.mockResolvedValue({ ok: true });
    render(<ResendVerificationForm />);
    type("Email", "dana@example.com");
    fireEvent.click(screen.getByRole("button", { name: "Email me a code" }));
    expect(await screen.findByLabelText("Confirmation code")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Use a different email" }));
    expect(screen.getByLabelText<HTMLInputElement>("Email").value).toBe("dana@example.com");
  });
});
