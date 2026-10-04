// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildRobots } from "@/lib/seo/robots";
import { buildSitemap } from "@/lib/seo/sitemap";
import { site } from "@/lib/site";

const currentUser = vi.fn();
const acceptLanguage = vi.fn(() => "fr-FR,fr;q=0.9");

vi.mock("@/app/(auth)/actions", () => ({
  registerAction: vi.fn(),
  loginAction: vi.fn(),
  logoutAction: vi.fn(),
  socialLoginAction: vi.fn(),
  resetPasswordAction: vi.fn(),
  verifyEmailAction: vi.fn(),
  forgotPasswordAction: vi.fn(),
  resendVerificationAction: vi.fn(),
}));
vi.mock("@/lib/session", () => ({ currentUser }));
// next/font runs at build time, so the test stands in for what it returns.
vi.mock("next/font/google", () => ({ Work_Sans: () => ({ variable: "work-sans-variable" }) }));
vi.mock("next/headers", () => ({ headers: async () => new Headers({ "accept-language": acceptLanguage() }) }));
vi.mock("next/navigation", async (original) => ({
  ...(await original<object>()),
  redirect: (url: string) => {
    throw new Error(`REDIRECT ${url}`);
  },
}));

const DEALER = { id: "u1", email: "dealer@example.com", first_name: "Dana", last_name: "Lee", phone: null, email_verified: true };

beforeEach(() => currentUser.mockResolvedValue(null));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("root layout", () => {
  it("wraps every page in the site's language and font with the banner above it", async () => {
    const { default: RootLayout, metadata } = await import("@/app/layout");
    const html = RootLayout({ children: <p>page</p> }) as ReactElement<{
      lang: string;
      className: string;
      children: ReactElement<{ children: unknown[] }>;
    }>;
    expect(html.props.lang).toBe(site.language);
    expect(html.props.className).toBe("work-sans-variable");
    expect(html.props.children.props.children).toHaveLength(2);
    expect(metadata.description).toBe(site.description);
  });
});

describe("robots and sitemap", () => {
  it("serve what the SEO builders produce", async () => {
    expect((await import("@/app/robots")).default()).toEqual(buildRobots());
    expect((await import("@/app/sitemap")).default()).toEqual(buildSitemap());
  });
});

describe("placeholder pages", () => {
  it.each(["alerts", "best-buys", "how-it-works", "pricing", "saved", "vin-lookup"])(
    "/%s is a blank main with its registered metadata",
    async (path) => {
      const page = await import(`@/app/${path}/page.tsx`);
      const { container } = render(page.default());
      expect(container.querySelector("main")?.childElementCount).toBe(0);
      expect(page.metadata.title).toBeTruthy();
    },
  );
});

describe("sign-in page", () => {
  const show = async (error?: string) => {
    const { default: LoginPage } = await import("@/app/(auth)/login/page");
    render(await LoginPage({ searchParams: Promise.resolve({ error }) }));
  };

  it("sends a signed-in dealer to the account page", async () => {
    currentUser.mockResolvedValue(DEALER);
    await expect(show()).rejects.toThrow("REDIRECT /account");
  });

  it("explains a failed social sign-in, in words for unknown codes too", async () => {
    await show("provider_denied");
    expect(screen.getByRole("alert").textContent).toBe("The sign-in was cancelled.");
    cleanup();
    await show("something_new");
    expect(screen.getByRole("alert").textContent).toBe("Something went wrong. Please try again.");
  });

  it("shows the form without an alert otherwise", async () => {
    await show();
    expect(screen.getByRole("heading", { level: 1, name: "Sign in" })).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

describe("register page", () => {
  it("sends a signed-in dealer to the account page", async () => {
    currentUser.mockResolvedValue(DEALER);
    const { default: RegisterPage } = await import("@/app/(auth)/register/page");
    await expect(RegisterPage()).rejects.toThrow("REDIRECT /account");
  });

  it("guesses the phone country from the browser's languages", async () => {
    const { default: RegisterPage } = await import("@/app/(auth)/register/page");
    render(await RegisterPage());
    expect(screen.getByRole("heading", { level: 1, name: "Start your free trial" })).toBeTruthy();
    expect(acceptLanguage).toHaveBeenCalled();
  });
});

describe("reset password page", () => {
  const show = async (token?: string) => {
    const { default: ResetPasswordPage } = await import("@/app/(auth)/reset-password/page");
    render(await ResetPasswordPage({ searchParams: Promise.resolve({ token }) }));
  };

  it("asks for the new password when the link carries its token", async () => {
    await show("tok");
    expect(screen.getByRole("button", { name: "Change password" })).toBeTruthy();
  });

  it("offers a new link when the token is missing", async () => {
    await show();
    expect(screen.getByRole("link", { name: "Request a new reset link" }).getAttribute("href")).toBe("/forgot-password");
  });
});

describe("email pages", () => {
  it("forgot password links back to sign in", async () => {
    const { default: ForgotPasswordPage } = await import("@/app/(auth)/forgot-password/page");
    render(ForgotPasswordPage());
    expect(screen.getByRole("link", { name: "Back to sign in" }).getAttribute("href")).toBe("/login");
  });

  it("confirm your email asks for the address", async () => {
    const { default: VerifyEmailPage } = await import("@/app/(auth)/verify-email/page");
    render(VerifyEmailPage());
    expect(screen.getByRole("heading", { level: 1, name: "Confirm your email" })).toBeTruthy();
    expect(screen.getByLabelText("Email")).toBeTruthy();
  });
});

describe("account page", () => {
  it("sends a visitor to sign in", async () => {
    const { default: AccountPage } = await import("@/app/account/page");
    await expect(AccountPage()).rejects.toThrow("REDIRECT /login");
  });

  it("shows the dealer's email and phone, or that none was given", async () => {
    const { default: AccountPage } = await import("@/app/account/page");
    currentUser.mockResolvedValue(DEALER);
    render(await AccountPage());
    expect(screen.getByText("dealer@example.com")).toBeTruthy();
    expect(screen.getByText("Not provided")).toBeTruthy();
    cleanup();
    currentUser.mockResolvedValue({ ...DEALER, phone: "+14155552671" });
    render(await AccountPage());
    expect(screen.getByText("+14155552671")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeTruthy();
  });
});
