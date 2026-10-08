// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const navigation = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => navigation.pathname }));
const { logoutAction } = vi.hoisted(() => ({ logoutAction: vi.fn() }));
vi.mock("@/app/[lang]/(auth)/actions", () => ({ logoutAction }));

const { AccountNav, initials } = await import("@/components/AccountNav");
const { I18nProvider } = await import("@/components/I18nProvider");
const { es } = await import("@/messages/es");

/** The nav as a Spanish page renders it. */
const spanish = () => (
  <I18nProvider value={{ locale: "es", m: es }}>
    <AccountNav />
  </I18nProvider>
);

/** Opens the account menu, as clicking the initials does. */
async function openMenu() {
  const button = await screen.findByRole("button", { name: "Account menu" });
  await act(async () => fireEvent.click(button));
  return screen.getByRole("menu");
}

const LOUNES = { first_name: "Lounes", last_name: "Hammache", email: "l@example.com" };

afterEach(() => {
  cleanup();
  navigation.pathname = "/";
  vi.unstubAllGlobals();
});

function session(user: { first_name: string; last_name: string; email: string } | null, unread = 0) {
  vi.stubGlobal("fetch", vi.fn(async () => Response.json({ user, unread })));
}

describe("AccountNav", () => {
  it.each(["/register", "/login", "/es/login"])("leaves the logo and the language alone on %s", async (pathname) => {
    navigation.pathname = pathname;
    session(LOUNES);
    render(<AccountNav />);
    await vi.waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(screen.queryAllByRole("navigation")).toEqual([]);
    expect(screen.queryAllByRole("link")).toEqual([]);
    expect(screen.getByRole("button", { name: "Language: English (United States)" })).toBeTruthy();
  });

  it("offers the language to visitors, after the free trial", async () => {
    session(null);
    render(<AccountNav />);
    await screen.findByRole("link", { name: "Sign in" });
    const last = screen.getByRole("navigation", { name: "Account" }).lastElementChild!;
    expect(last.getAttribute("aria-label")).toBe("Language: English (United States)");
    expect(last.textContent).toBe("English");
  });

  it("opens the language dialog from the earth button, each language a link to this page in it", async () => {
    navigation.pathname = "/active-lots";
    window.history.replaceState(null, "", "/active-lots?make=TOYOTA");
    session(null);
    render(<AccountNav />);
    const earth = await screen.findByRole("button", { name: /^Language/ });
    await act(async () => fireEvent.click(earth));
    const dialog = screen.getByRole("dialog", { name: "Choose a language:" });
    expect(within(dialog).getAllByRole("link").map((link) => [link.textContent, link.getAttribute("href"), link.getAttribute("aria-current")])).toEqual([
      ["English (United States)", "/en/active-lots?make=TOYOTA", "true"],
      ["Español (Estados Unidos)", "/es/active-lots?make=TOYOTA", null],
    ]);
    expect(within(dialog).getByRole("button", { name: "Close" })).toBeTruthy();
    window.history.replaceState(null, "", "/");
  });

  it("links the home page in each language without a trailing slash", async () => {
    session(null);
    render(spanish());
    const earth = await screen.findByRole("button", { name: /^Idioma/ });
    await act(async () => fireEvent.click(earth));
    const dialog = screen.getByRole("dialog", { name: es.language.title });
    expect(within(dialog).getAllByRole("link").map((link) => link.getAttribute("href"))).toEqual(["/en", "/es"]);
    expect(within(dialog).getByRole("link", { name: "Español (Estados Unidos)" }).getAttribute("aria-current")).toBe("true");
  });

  it("links every item in the page's language and marks the current one under its prefix", async () => {
    navigation.pathname = "/es/active-lots/copart/41633106";
    session(null);
    render(spanish());
    const menu = await screen.findByRole("navigation", { name: es.nav.main });
    expect([...menu.querySelectorAll("a")].map((link) => [link.textContent, link.getAttribute("href")])).toEqual([
      [es.nav.activeLots, "/es/active-lots"],
      [es.nav.vinLookup, "/es/vin-lookup"],
      [es.nav.howItWorks, "/es/how-it-works"],
      [es.nav.pricing, "/es/pricing"],
    ]);
    expect(menu.querySelector("[aria-current]")?.textContent).toBe(es.nav.activeLots);
    expect(screen.getByRole("link", { name: es.nav.signIn }).getAttribute("href")).toBe("/es/login");
  });

  it("offers sign in and the free trial to visitors", async () => {
    session(null);
    render(<AccountNav />);
    expect((await screen.findByRole("link", { name: "Sign in" })).getAttribute("href")).toBe("/login");
    const trial = screen.getByRole("link", { name: /7 days free trial/ });
    expect(trial.getAttribute("href")).toBe("/register");
    expect(trial.textContent).toContain("No credit cards required");
  });

  it.each([
    ["/active-lots", "Active lots", "page"],
    ["/active-lots/copart/41633106", "Active lots", "true"], // a lot's page is in Active lots
    ["/pricing", "Pricing", "page"],
  ])("marks the item of %s as the current one", async (pathname, label, current) => {
    navigation.pathname = pathname;
    session(null);
    render(<AccountNav />);
    const menu = await screen.findByRole("navigation", { name: "Main" });
    const marked = [...menu.querySelectorAll("[aria-current]")];
    expect(marked.map((link) => [link.textContent, link.getAttribute("aria-current")])).toEqual([[label, current]]);
  });

  it("marks no item on a page outside the menu, or one that only starts like an item", async () => {
    for (const pathname of ["/", "/pricing-old"]) {
      navigation.pathname = pathname;
      session(null);
      render(<AccountNav />);
      const menu = await screen.findByRole("navigation", { name: "Main" });
      expect(menu.querySelector("[aria-current]")).toBeNull();
      cleanup();
    }
  });

  it("shows the visitor menu", async () => {
    session(null);
    render(<AccountNav />);
    const menu = await screen.findByRole("navigation", { name: "Main" });
    expect([...menu.querySelectorAll("a")].map((link) => [link.textContent, link.getAttribute("href")])).toEqual([
      ["Active lots", "/active-lots"],
      ["VIN Lookup", "/vin-lookup"],
      ["How It Works", "/how-it-works"],
      ["Pricing", "/pricing"],
    ]);
  });

  it("swaps How It Works and Pricing for Saved and Alerts once signed in", async () => {
    session(LOUNES);
    render(<AccountNav />);
    const menu = await screen.findByRole("navigation", { name: "Main" });
    expect([...menu.querySelectorAll("a")].map((link) => [link.textContent, link.getAttribute("href")])).toEqual([
      ["Active lots", "/active-lots"],
      ["VIN Lookup", "/vin-lookup"],
      ["Saved", "/saved"],
      ["Alerts", "/alerts"],
    ]);
  });

  it("shows the signed-in dealer's initials in a round button that opens the account menu", async () => {
    session(LOUNES);
    render(<AccountNav />);
    const button = await screen.findByRole("button", { name: "Account menu" });
    expect(button.textContent).toBe("LH");
    expect(button.className).toContain("rounded-full");
    expect(button.getAttribute("aria-haspopup")).toBe("menu");
    expect(screen.queryByText("Lounes Hammache")).toBeNull();
    expect(screen.queryByRole("link", { name: "Sign in" })).toBeNull();
    await openMenu();
    expect(button.getAttribute("aria-expanded")).toBe("true");
  });

  it("lists the dealer, Settings, Account and Log out in the menu", async () => {
    session(LOUNES);
    render(<AccountNav />);
    const menu = await openMenu();
    expect(menu.textContent).toContain("LH");
    expect(within(menu).getByText("Lounes Hammache")).toBeTruthy();
    expect(within(menu).getByText("l@example.com")).toBeTruthy();
    expect(within(menu).getAllByRole("menuitem").map((item) => [item.textContent, item.getAttribute("href")])).toEqual([
      ["Saved", "/saved"],
      ["Alerts", "/alerts"],
      ["Settings", "/settings"],
      ["Account", "/account"],
      ["Log out", null],
      ["English (United States)", null],
    ]);
  });

  it("reaches Saved and Alerts from the account menu where the main menu is hidden", async () => {
    session(LOUNES);
    render(<AccountNav />);
    const menu = await openMenu();
    for (const name of ["Saved", "Alerts"]) expect(within(menu).getByRole("menuitem", { name }).className).toContain("lg:hidden");
    expect(within(menu).getByRole("menuitem", { name: "Settings" }).className).not.toContain("lg:hidden");
  });

  it("counts the unread alerts on Alerts and, where the main menu is hidden, on the initials", async () => {
    session(LOUNES, 3);
    render(<AccountNav />);
    const alerts = within(await screen.findByRole("navigation", { name: "Main" })).getByRole("link", { name: "Alerts, 3 unread" });
    expect(alerts.textContent).toBe("Alerts3");
    const button = screen.getByRole("button", { name: "Account menu, 3 unread alerts" });
    expect(button.textContent).toBe("LH3");
    await act(async () => fireEvent.click(button));
    const menu = screen.getByRole("menu");
    expect(within(menu).getByRole("menuitem", { name: "Alerts, 3 unread" }).textContent).toBe("Alerts3");
  });

  it("counts them in the page's language", async () => {
    session(LOUNES, 1200);
    render(spanish());
    expect(await screen.findByRole("link", { name: "Alertas, 1,200 sin leer" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Menú de la cuenta, 1,200 alertas sin leer" })).toBeTruthy();
  });

  it("opens the language dialog from the menu's last item, and gives focus back to the initials", async () => {
    session(LOUNES);
    render(<AccountNav />);
    await openMenu();
    await act(async () => fireEvent.click(screen.getByRole("menuitem", { name: "English (United States)" })));
    expect(screen.queryByRole("menu")).toBeNull();
    const dialog = screen.getByRole("dialog", { name: "Choose a language:" });
    expect(within(dialog).getAllByRole("link")).toHaveLength(2);
    await act(async () => fireEvent.click(within(dialog).getByRole("button", { name: "Close" })));
    await vi.waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("closes the menu when one of its links is followed, not on any click", async () => {
    session(LOUNES);
    render(<AccountNav />);
    await openMenu();
    await act(async () => fireEvent.click(screen.getByText("Lounes Hammache")));
    expect(screen.getByRole("menu")).toBeTruthy();
    await act(async () => fireEvent.click(screen.getByRole("menuitem", { name: "Settings" })));
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("logs out, forgetting the remembered email", async () => {
    window.sessionStorage.setItem("cs_email", "dana@example.com");
    session(LOUNES);
    render(<AccountNav />);
    await openMenu();
    await act(async () => fireEvent.click(screen.getByRole("menuitem", { name: "Log out" })));
    expect(window.sessionStorage.getItem("cs_email")).toBe(null);
    expect(logoutAction).toHaveBeenCalledTimes(1);
  });

  it("falls back to signed out when the session cannot be read", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("offline"))));
    render(<AccountNav />);
    expect(await screen.findByRole("link", { name: "Sign in" })).toBeTruthy();
  });
});

describe("AccountNav fallbacks", () => {
  it("treats a failed session answer as signed out", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 502 })));
    render(<AccountNav />);
    expect(await screen.findByRole("link", { name: "Sign in" })).toBeTruthy();
  });

  it("shows only the email for a dealer without names, with its first letter as initials", async () => {
    session({ first_name: "", last_name: "", email: "dealer@example.com" });
    render(<AccountNav />);
    expect((await screen.findByRole("button", { name: "Account menu" })).textContent).toBe("D");
    const menu = await openMenu();
    expect(menu.querySelectorAll("p")).toHaveLength(1);
    expect(within(menu).getByText("dealer@example.com")).toBeTruthy();
  });
});

describe("initials", () => {
  it("takes the first letter of each name, upper-cased", () => {
    expect(initials({ first_name: "lounes", last_name: "hammache", email: "l@example.com" })).toBe("LH");
    expect(initials({ first_name: "Lounes", last_name: "", email: "l@example.com" })).toBe("L");
    expect(initials({ first_name: "", last_name: "Hammache", email: "l@example.com" })).toBe("H");
    expect(initials({ first_name: "", last_name: "", email: "l@example.com" })).toBe("L");
  });
});
