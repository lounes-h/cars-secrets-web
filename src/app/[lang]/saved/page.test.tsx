// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sampleLot } from "@/lib/lots-fixture";

const { currentUser, getSavedLots, getSavedSearches } = vi.hoisted(() => ({
  currentUser: vi.fn(),
  getSavedLots: vi.fn(),
  getSavedSearches: vi.fn(),
}));
vi.mock("@/lib/session", () => ({ currentUser, sessionToken: async () => "token-abc", visitorIp: async () => "9.9.9.9" }));
vi.mock("@/lib/saved", async (original) => ({ ...(await original<object>()), getSavedLots, getSavedSearches }));
vi.mock("@/app/[lang]/saved/actions", () => ({}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));

const { default: SavedPage, generateMetadata } = await import("@/app/[lang]/saved/page");

const OFF = { change_alerts: false, remind_hour: false, remind_day: false };
const LISTED = { ...OFF, lot: sampleLot, available: true, saved_at: "2026-10-07T00:00:00Z", remind_hour: true };
const GONE = { ...OFF, lot: { ...sampleLot, lot_number: "7", year: 2019, make: "HONDA", model: "CIVIC", trim: null }, available: false, saved_at: "2026-10-01T00:00:00Z" };
/** A tab's rows: its list's own items, not the lists inside them (a card's badges). */
const rows = (panel: HTMLElement) => [...panel.querySelectorAll<HTMLElement>(":scope > ul > li")];

const CAMRY = { id: "s1", name: "Camry", query: "make=TOYOTA&model=CAMRY", alerts: true, created_at: "2026-10-07T00:00:00Z" };

beforeEach(() => {
  currentUser.mockResolvedValue({ id: "u1", email: "dealer@example.com" });
  getSavedLots.mockResolvedValue([LISTED, GONE]);
  getSavedSearches.mockResolvedValue([CAMRY, { ...CAMRY, id: "s2", name: "Everything", query: "" }]);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("Saved page", () => {
  it("is titled from its registered words", async () => {
    expect((await generateMetadata()).title).toEqual({ absolute: "Saved lots and searches" });
  });

  it("asks a visitor to sign in instead of listing anything", async () => {
    currentUser.mockResolvedValue(null);
    render(await SavedPage());
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Saved lots and searches");
    expect(screen.getByRole("link", { name: "Sign in to see what you saved" }).getAttribute("href")).toBe("/login");
    expect(getSavedLots).not.toHaveBeenCalled();
  });

  it("lists the saved lots and searches behind two tabs, the lots first", async () => {
    render(await SavedPage());
    expect(getSavedLots).toHaveBeenCalledWith("token-abc", "9.9.9.9");
    expect(screen.getByText("The lots and searches you saved, with the alerts and reminders you set on each.")).toBeTruthy();
    expect(screen.getAllByRole("tab").map((tab) => [tab.textContent, tab.getAttribute("aria-selected")])).toEqual([
      ["Lots · 2", "true"],
      ["Searches · 2", "false"],
    ]);
  });

  it("gives a listed lot its reminders and change alerts, and a lot the auction dropped only a way out", async () => {
    render(await SavedPage());
    const [listed, gone] = rows(screen.getAllByRole("tabpanel", { hidden: true })[0]);

    expect(within(listed).getByRole("link", { name: "2013 ACURA TSX TECH" })).toBeTruthy();
    expect(within(listed).getAllByRole("button").map((button) => button.textContent)).toEqual(["Saved", "Remind me"]);
    expect(listed.textContent).toContain("Reminders: 1 hour before");
    expect(within(listed).getByRole("checkbox", { name: "Email me when the auction date changes" })).toBeTruthy();

    expect(gone.textContent).toContain("No longer listed");
    expect(within(gone).queryAllByRole("link")).toEqual([]);
    expect(within(gone).getAllByRole("button").map((button) => button.textContent)).toEqual(["Saved"]);
  });

  it("names each search's filters, opens its lots, and gives it its controls", async () => {
    render(await SavedPage());
    const [camry, everything] = rows(screen.getAllByRole("tabpanel", { hidden: true })[1]);

    expect(within(camry).getByRole("link", { name: "Camry", hidden: true }).getAttribute("href")).toBe("/active-lots?make=TOYOTA&model=CAMRY");
    expect(camry.textContent).toContain("TOYOTA · CAMRY");
    expect(within(camry).getByRole("link", { name: "Edit filters", hidden: true }).getAttribute("href")).toBe(
      "/active-lots?make=TOYOTA&model=CAMRY&saved=s1",
    );
    expect(everything.textContent).toContain("Every active lot");
  });

  it("says what to do while nothing is saved", async () => {
    getSavedLots.mockResolvedValue([]);
    getSavedSearches.mockResolvedValue([]);
    render(await SavedPage());
    expect(screen.getByText("No saved lots yet. Use Save on a lot to keep it here.")).toBeTruthy();
    expect(screen.getByText("No saved searches yet. Set the filters on Active lots, then use Save search.")).toBeTruthy();
  });
});
