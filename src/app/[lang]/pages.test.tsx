// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { lang } from "next/root-params";
import { buildRobots } from "@/lib/seo/robots";
import { buildSitemap } from "@/lib/seo/sitemap";
import { en } from "@/messages/en";
import { es } from "@/messages/es";

const currentUser = vi.fn();
const rememberedChoice = vi.fn(async () => false);
const acceptLanguage = vi.fn(() => "fr-FR,fr;q=0.9");

vi.mock("@/app/[lang]/(auth)/actions", () => ({
  registerAction: vi.fn(),
  loginAction: vi.fn(),
  logoutAction: vi.fn(),
  socialLoginAction: vi.fn(),
  resetPasswordAction: vi.fn(),
  verifyEmailAction: vi.fn(),
  forgotPasswordAction: vi.fn(),
  resendVerificationAction: vi.fn(),
}));
vi.mock("@/lib/session", () => ({ currentUser, rememberedChoice }));
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

type Html = ReactElement<{
  lang: string;
  className: string;
  children: ReactElement<{ children: ReactElement<{ value: unknown; children: unknown[] }> }>;
}>;

describe("root layout", () => {
  it("wraps every page in its language and the site's font, with the banner above it", async () => {
    const { default: RootLayout, generateMetadata } = await import("@/app/[lang]/layout");
    const html = (await RootLayout({ children: <p>page</p> })) as Html;
    expect(html.props.lang).toBe("en-US");
    expect(html.props.className).toBe("work-sans-variable");
    const provider = html.props.children.props.children;
    expect(provider.props.value).toEqual({ locale: "en", m: en });
    expect(provider.props.children).toHaveLength(2);
    expect((await generateMetadata()).description).toBe(en.site.description);
  });

  it("speaks Spanish under /es", async () => {
    vi.mocked(lang).mockResolvedValue("es");
    const { default: RootLayout, generateMetadata } = await import("@/app/[lang]/layout");
    const html = (await RootLayout({ children: <p>page</p> })) as Html;
    expect(html.props.lang).toBe("es-US");
    expect(html.props.children.props.children.props.value).toEqual({ locale: "es", m: es });
    expect(await generateMetadata()).toMatchObject({ description: es.site.description, title: { default: es.pages["/"].title } });
    vi.mocked(lang).mockResolvedValue("en");
  });

  it("is one static tree per language, and a 404 for any other", async () => {
    const layout = await import("@/app/[lang]/layout");
    expect(layout.generateStaticParams()).toEqual([{ lang: "en" }, { lang: "es" }]);
    vi.mocked(lang).mockResolvedValue("fr");
    await expect(layout.default({ children: null })).rejects.toThrow();
    vi.mocked(lang).mockResolvedValue("en");
  });
});

describe("robots and sitemap", () => {
  it("serve what the SEO builders produce", async () => {
    expect((await import("@/app/robots")).default()).toEqual(buildRobots());
    expect((await import("@/app/sitemap")).default()).toEqual(buildSitemap());
  });
});

describe("page metadata", () => {
  const PAGES = {
    "/": "page",
    "/active-lots": "active-lots/page",
    "/register": "(auth)/register/page",
    "/login": "(auth)/login/page",
    "/forgot-password": "(auth)/forgot-password/page",
    "/reset-password": "(auth)/reset-password/page",
    "/verify-email": "(auth)/verify-email/page",
    "/account": "account/page",
  } as const;

  it.each(Object.entries(PAGES))("%s is titled from its registered words, in the page's language", async (path, file) => {
    const page = await import(`@/app/[lang]/${file}.tsx`);
    const key = path as keyof typeof PAGES;
    expect((await page.generateMetadata()).title).toEqual({ absolute: en.pages[key].title });
    vi.mocked(lang).mockResolvedValueOnce("es");
    expect((await page.generateMetadata()).title).toEqual({ absolute: es.pages[key].title });
  });
});

describe("a path no page matches", () => {
  it("is a 404 inside the root layout", async () => {
    const { default: Missing } = await import("@/app/[lang]/[...missing]/page");
    expect(() => Missing()).toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
  });

  it("says so in the page's language", async () => {
    const { default: NotFound } = await import("@/app/[lang]/not-found");
    render(await NotFound());
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(en.notFound);
    cleanup();
    vi.mocked(lang).mockResolvedValueOnce("es");
    render(await NotFound());
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(es.notFound);
  });
});

describe("placeholder pages", () => {
  it.each(["best-buys", "how-it-works", "pricing", "vin-lookup"])(
    "/%s is a blank main with its registered metadata",
    async (path) => {
      const page = await import(`@/app/[lang]/${path}/page.tsx`);
      const { container } = render(page.default());
      expect(container.querySelector("main")?.childElementCount).toBe(0);
      expect((await page.generateMetadata()).title).toEqual({ absolute: en.pages[`/${path}` as keyof typeof en.pages].title });
    },
  );
});

describe("sign-in page", () => {
  const show = async (error?: string) => {
    const { default: LoginPage } = await import("@/app/[lang]/(auth)/login/page");
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
    expect(screen.getByRole("checkbox", { name: "Remember me" }).getAttribute("aria-checked")).toBe("false");
  });

  it("ticks remember me when the last sign-in in this browser had it ticked", async () => {
    rememberedChoice.mockResolvedValueOnce(true);
    await show();
    expect(screen.getByRole("checkbox", { name: "Remember me" }).getAttribute("aria-checked")).toBe("true");
  });
});

describe("register page", () => {
  it("sends a signed-in dealer to the account page", async () => {
    currentUser.mockResolvedValue(DEALER);
    const { default: RegisterPage } = await import("@/app/[lang]/(auth)/register/page");
    await expect(RegisterPage()).rejects.toThrow("REDIRECT /account");
  });

  it("guesses the phone country from the browser's languages", async () => {
    const { default: RegisterPage } = await import("@/app/[lang]/(auth)/register/page");
    render(await RegisterPage());
    expect(screen.getByRole("heading", { level: 1, name: "Start your free trial" })).toBeTruthy();
    expect(acceptLanguage).toHaveBeenCalled();
  });
});

describe("reset password page", () => {
  const show = async (token?: string) => {
    const { default: ResetPasswordPage } = await import("@/app/[lang]/(auth)/reset-password/page");
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
    const { default: ForgotPasswordPage } = await import("@/app/[lang]/(auth)/forgot-password/page");
    render(await ForgotPasswordPage());
    expect(screen.getByRole("link", { name: "Back to sign in" }).getAttribute("href")).toBe("/login");
  });

  it("confirm your email asks for the address", async () => {
    const { default: VerifyEmailPage } = await import("@/app/[lang]/(auth)/verify-email/page");
    render(await VerifyEmailPage());
    expect(screen.getByRole("heading", { level: 1, name: "Confirm your email" })).toBeTruthy();
    expect(screen.getByLabelText("Email")).toBeTruthy();
  });
});

describe("account page", () => {
  it("sends a visitor to sign in", async () => {
    const { default: AccountPage } = await import("@/app/[lang]/account/page");
    await expect(AccountPage()).rejects.toThrow("REDIRECT /login");
  });

  it("shows the dealer's email and phone, or that none was given", async () => {
    const { default: AccountPage } = await import("@/app/[lang]/account/page");
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
