// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/app/(auth)/actions", () => ({
  registerAction: vi.fn(),
  loginAction: vi.fn(),
  socialLoginAction: vi.fn(),
  resetPasswordAction: vi.fn(),
  verifyEmailAction: vi.fn(),
  forgotPasswordAction: vi.fn(),
}));

const { RegisterForm } = await import("@/components/auth/RegisterForm");
const { LoginForm } = await import("@/components/auth/LoginForm");
const { SocialButtons } = await import("@/components/auth/SocialButtons");
const { ResetPasswordForm } = await import("@/components/auth/ResetPasswordForm");
const { VerifyEmailForm } = await import("@/components/auth/VerifyEmailForm");

afterEach(cleanup);

describe("RegisterForm", () => {
  it("has the account fields, a required terms checkbox and no captcha without a site key", () => {
    render(<RegisterForm phoneField={<p>phone</p>} />);
    for (const label of ["First name", "Last name", "Email", "Password"]) {
      expect(screen.getByLabelText(label).hasAttribute("required")).toBe(true);
    }
    const terms = screen.getByLabelText("I accept the Terms of Use and Privacy Policy");
    expect(terms.getAttribute("type")).toBe("checkbox");
    expect(terms.hasAttribute("required")).toBe(true);
    expect(screen.getByText("phone")).toBeTruthy();
    expect(screen.queryByTestId("turnstile")).toBeNull();
    expect(screen.getByRole("button", { name: "Create account" })).toBeTruthy();
  });
});

describe("LoginForm", () => {
  it("has email, password, remember me and a forgot password link", () => {
    render(<LoginForm />);
    expect(screen.getByLabelText("Email").getAttribute("type")).toBe("email");
    expect(screen.getByLabelText("Password").getAttribute("autocomplete")).toBe("current-password");
    expect(screen.getByLabelText("Remember me").getAttribute("type")).toBe("checkbox");
    expect(screen.getByRole("link", { name: "Forgot your password?" }).getAttribute("href")).toBe("/forgot-password");
    expect(screen.getByRole("button", { name: "Sign in" })).toBeTruthy();
  });
});

describe("SocialButtons", () => {
  it("offers Google and Apple", () => {
    render(<SocialButtons intent="Register" />);
    expect(screen.getByRole("button", { name: "Register with Google" }).getAttribute("value")).toBe("google");
    expect(screen.getByRole("button", { name: "Register with Apple" }).getAttribute("value")).toBe("apple");
  });
});

describe("token forms", () => {
  it("carry the emailed token in a hidden field", () => {
    const { container } = render(
      <>
        <ResetPasswordForm token="reset-tok" />
        <VerifyEmailForm token="verify-tok" />
      </>,
    );
    const tokens = [...container.querySelectorAll<HTMLInputElement>('input[name="token"]')].map((i) => i.value);
    expect(tokens).toEqual(["reset-tok", "verify-tok"]);
    expect(screen.getByLabelText("Confirm new password")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Confirm my email" })).toBeTruthy();
  });
});
