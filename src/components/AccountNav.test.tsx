// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
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
  it("offers sign in and register to visitors", async () => {
    session(null);
    render(<AccountNav />);
    expect((await screen.findByRole("link", { name: "Sign in" })).getAttribute("href")).toBe("/login");
    expect(screen.getByRole("link", { name: "Register" }).getAttribute("href")).toBe("/register");
  });

  it("shows the signed-in dealer and a sign out button", async () => {
    session({ first_name: "Lounes", email: "l@example.com" });
    render(<AccountNav />);
    const account = await screen.findByRole("link", { name: /Lounes/ });
    expect(account.getAttribute("href")).toBe("/account");
    expect(screen.getByRole("button", { name: "Sign out" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Sign in" })).toBeNull();
  });

  it("falls back to signed out when the session cannot be read", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("offline"))));
    render(<AccountNav />);
    expect(await screen.findByRole("link", { name: "Sign in" })).toBeTruthy();
  });
});
