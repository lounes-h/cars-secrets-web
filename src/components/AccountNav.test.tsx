// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const navigation = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => navigation.pathname }));
const { logoutAction } = vi.hoisted(() => ({ logoutAction: vi.fn() }));
vi.mock("@/app/(auth)/actions", () => ({ logoutAction }));

const { AccountNav, initials } = await import("@/components/AccountNav");

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

function session(user: { first_name: string; last_name: string; email: string } | null) {
  vi.stubGlobal("fetch", vi.fn(async () => Response.json({ user })));
}

describe("AccountNav", () => {
  it.each(["/register", "/login"])("leaves the logo alone on %s", async (pathname) => {
    navigation.pathname = pathname;
    session(LOUNES);
    const { container } = render(<AccountNav />);
    await vi.waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(container.innerHTML).toBe("");
  });

  it("offers sign in and the free trial to visitors", async () => {
    session(null);
    render(<AccountNav />);
    expect((await screen.findByRole("link", { name: "Sign in" })).getAttribute("href")).toBe("/login");
    const trial = screen.getByRole("link", { name: /7 days free trial/ });
    expect(trial.getAttribute("href")).toBe("/register");
    expect(trial.textContent).toContain("No credit cards required");
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
      ["Settings", "/settings"],
      ["Account", "/account"],
      ["Log out", null],
    ]);
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
