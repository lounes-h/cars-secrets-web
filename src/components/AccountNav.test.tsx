// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));
vi.mock("@/app/(auth)/actions", () => ({ logoutAction: vi.fn() }));

const { AccountNav } = await import("@/components/AccountNav");

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function session(user: { first_name: string; email: string } | null) {
  vi.stubGlobal("fetch", vi.fn(async () => Response.json({ user })));
}

describe("AccountNav", () => {
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
    session({ first_name: "Lounes", email: "l@example.com" });
    render(<AccountNav />);
    const menu = await screen.findByRole("navigation", { name: "Main" });
    expect([...menu.querySelectorAll("a")].map((link) => [link.textContent, link.getAttribute("href")])).toEqual([
      ["Active lots", "/active-lots"],
      ["VIN Lookup", "/vin-lookup"],
      ["Saved", "/saved"],
      ["Alerts", "/alerts"],
    ]);
  });

  it("shows the signed-in dealer and a sign out button", async () => {
    session({ first_name: "Lounes", email: "l@example.com" });
    render(<AccountNav />);
    const account = await screen.findByRole("link", { name: /Lounes/ });
    expect(account.getAttribute("href")).toBe("/account");
    expect(screen.getByRole("button", { name: "Sign out" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Sign in" })).toBeNull();
  });

  it("forgets the remembered email when the dealer signs out", async () => {
    window.sessionStorage.setItem("cs_email", "dana@example.com");
    session({ first_name: "Lounes", email: "l@example.com" });
    render(<AccountNav />);
    fireEvent.submit(await screen.findByRole("button", { name: "Sign out" }));
    expect(window.sessionStorage.getItem("cs_email")).toBe(null);
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

  it("names a dealer without a first name by their email", async () => {
    session({ first_name: "", email: "dealer@example.com" });
    render(<AccountNav />);
    expect(await screen.findByText("dealer@example.com")).toBeTruthy();
  });
});
