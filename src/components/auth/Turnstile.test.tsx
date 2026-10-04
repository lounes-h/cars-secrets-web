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
vi.mock("next/script", () => ({ default: () => null }));

const { Turnstile } = await import("@/components/auth/Turnstile");
const { ForgotPasswordForm } = await import("@/components/auth/ForgotPasswordForm");
const { LoginForm } = await import("@/components/auth/LoginForm");
const { RegisterForm } = await import("@/components/auth/RegisterForm");

type Options = { sitekey: string; action?: string; callback?: (token: string) => void; "expired-callback"?: () => void };
let options: Options;
const widget = {
  render: vi.fn((_el: HTMLElement, opts: Options) => {
    options = opts;
    return "widget-1";
  }),
  reset: vi.fn(),
};
/** Solves the challenge, as Cloudflare's script does once the visitor passes it. */
const solve = (token: string) => options.callback?.(token);

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "site-key");
  window.turnstile = widget;
  window.sessionStorage.clear();
});
afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.clearAllMocks();
  delete window.turnstile;
  delete window.onloadTurnstileCallback;
});

const type = (label: string, value: string) => fireEvent.input(screen.getByLabelText(label), { target: { value } });

describe("Turnstile", () => {
  it("renders nothing while no site key is set", () => {
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "");
    const { container } = render(<Turnstile action="login" onToken={vi.fn()} />);
    expect(container.innerHTML).toBe("");
    expect(widget.render).not.toHaveBeenCalled();
  });

  it("renders the widget once and passes on solved and expired tokens", () => {
    const onToken = vi.fn();
    const { rerender } = render(<Turnstile action="login" onToken={onToken} />);
    expect(widget.render).toHaveBeenCalledWith(screen.getByTestId("turnstile"), expect.objectContaining({ sitekey: "site-key", action: "login" }));
    solve("tok");
    expect(onToken).toHaveBeenLastCalledWith("tok");
    options["expired-callback"]?.();
    expect(onToken).toHaveBeenLastCalledWith(null);

    // A new challenge after a failed submit: tokens are single use.
    rerender(<Turnstile action="login" onToken={onToken} resetSignal={1} />);
    expect(widget.reset).toHaveBeenCalledWith("widget-1");
    expect(onToken).toHaveBeenLastCalledWith(null);
    expect(widget.render).toHaveBeenCalledTimes(1);
  });

  it("waits for Cloudflare's script when it has not loaded yet", () => {
    delete window.turnstile;
    render(<Turnstile action="login" onToken={vi.fn()} />);
    expect(widget.render).not.toHaveBeenCalled();
    window.turnstile = widget;
    window.onloadTurnstileCallback?.();
    expect(widget.render).toHaveBeenCalledTimes(1);
  });
});

describe("forms with the captcha", () => {
  it("forgot password sends the token, starts a new challenge after an error, and confirms once sent", async () => {
    actions.forgotPasswordAction.mockResolvedValueOnce({ code: "captcha_failed", message: "The captcha expired." });
    render(<ForgotPasswordForm />);
    type("Email", "dana@example.com");
    solve("tok-1");
    fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));
    expect(await screen.findByText("The captcha expired.")).toBeTruthy();
    expect(actions.forgotPasswordAction).toHaveBeenCalledWith({ email: "dana@example.com", captcha_token: "tok-1" });
    await waitFor(() => expect(widget.reset).toHaveBeenCalled());

    actions.forgotPasswordAction.mockResolvedValueOnce({ ok: true });
    solve("tok-2");
    fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));
    expect((await screen.findByRole("status")).textContent).toContain("If an account uses dana@example.com");

    fireEvent.click(screen.getByRole("button", { name: "Try another one" }));
    expect(screen.getByLabelText<HTMLInputElement>("Email").value).toBe("dana@example.com");
  });

  it("sign in shows the captcha only once the API asks for it", async () => {
    actions.loginAction.mockResolvedValue({ code: "captcha_required", message: "Too many attempts.", captchaRequired: true });
    render(<LoginForm />);
    expect(screen.queryByTestId("turnstile")).toBeNull();
    type("Email", "dana@example.com");
    type("Password", "whatever-password");
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    await screen.findByTestId("turnstile");
    // The widget renders and resets in effects that can run after the div appears; solving
    // before then lost the token on a slow CI runner.
    await waitFor(() => expect(widget.reset).toHaveBeenCalled());
    solve("tok");
    type("Password", "whatever-password");
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    await waitFor(() => expect(actions.loginAction).toHaveBeenLastCalledWith(expect.objectContaining({ captcha_token: "tok" })));
  });

  it("register sends the token with the form", async () => {
    actions.registerAction.mockResolvedValue({ code: "validation", message: "Fix fields." });
    render(<RegisterForm countries={countries().filter((c) => c.code === "US")} defaultCountry="US" />);
    type("First name", "Dana");
    type("Last name", "Lee");
    type("Email", "dana@example.com");
    type("Password", "long-enough-pw1");
    solve("tok");
    fireEvent.click(screen.getByRole("button", { name: "Agree and register" }));
    await waitFor(() => expect(actions.registerAction).toHaveBeenCalledWith(expect.objectContaining({ captcha_token: "tok" })));
  });
});
