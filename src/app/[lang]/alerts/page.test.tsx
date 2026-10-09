// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { lang } from "next/root-params";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Alert, LotSummary } from "@/lib/alerts";

const { currentUser, getAlerts } = vi.hoisted(() => ({ currentUser: vi.fn(), getAlerts: vi.fn() }));
vi.mock("@/lib/session", () => ({ currentUser, sessionToken: async () => "token-abc", visitorIp: async () => "9.9.9.9" }));
vi.mock("@/lib/alerts", async (original) => ({ ...(await original<object>()), getAlerts }));
vi.mock("@/app/[lang]/alerts/actions", () => ({ markAlertReadAction: vi.fn(), markAllAlertsReadAction: vi.fn() }));

const { default: AlertsPage, generateMetadata } = await import("@/app/[lang]/alerts/page");

const LOT: LotSummary = {
  source: "copart",
  lot_number: "41633106",
  year: 2013,
  make: "ACURA",
  model: "TSX",
  trim: null,
  sale_at: "2026-10-09T15:00:00Z",
  sale_date: "2026-10-09",
  location_city: "VALLEJO",
  location_state: "CA",
  thumbnail_url: null,
  high_bid: 0,
  buy_it_now_price: 9500,
  currency: "USD",
  odometer: 120500,
  damage_primary: "FRONT END",
};
const HONDA = { ...LOT, lot_number: "7", year: 2019, make: "HONDA", model: "CIVIC", sale_at: null, sale_date: null };

const MATCHES: Alert = {
  id: 3,
  kind: "matches",
  created_at: "2026-10-08T07:00:00Z",
  read: false,
  payload: {
    total: 2,
    searches: [
      { id: "s1", name: "Acuras", query: "make=ACURA", total: 1, lots: [{ ...LOT, searches: ["Acuras", "Under $10k"] }] },
      { id: "s2", name: "Under $10k", query: "bid_max=10000", total: 14, lots: [{ ...HONDA, searches: ["Under $10k"] }] },
    ],
  },
};
const CHANGES: Alert = {
  id: 2,
  kind: "changes",
  created_at: "2026-10-07T18:00:00Z",
  read: true,
  payload: {
    lots: [
      {
        lot: LOT,
        changes: {
          sale: { from: { at: null, date: null }, to: { at: "2026-10-09T15:00:00Z", date: "2026-10-09" } },
          buy_now: { from: 9500, to: null },
        },
      },
    ],
  },
};
const REMINDER: Alert = {
  id: 1,
  kind: "reminder",
  created_at: "2026-10-09T14:00:00Z",
  read: true,
  payload: { lot: LOT, reminders: ["hour"], changes: { sale: { from: { at: null, date: "2026-10-10" }, to: { at: "2026-10-09T15:00:00Z", date: null } } } },
};

async function show(params: Record<string, string> = {}) {
  render(await AlertsPage({ searchParams: Promise.resolve(params) }));
}

beforeEach(() => {
  currentUser.mockResolvedValue({ id: "u1", email: "dealer@example.com" });
  getAlerts.mockResolvedValue({ items: [MATCHES, CHANGES, REMINDER], total: 3, unread: 1 });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const entries = () => within(screen.getByRole("list", { name: "Alerts" })).getAllByRole("article");

describe("Alerts page", () => {
  it("is titled from its registered words", async () => {
    expect((await generateMetadata()).title).toEqual({ absolute: "Your alerts | Car Bid Insight" });
  });

  it("asks a visitor to sign in", async () => {
    currentUser.mockResolvedValue(null);
    await show();
    expect(screen.getByRole("link", { name: "Sign in to see your alerts" }).getAttribute("href")).toBe("/login");
    expect(getAlerts).not.toHaveBeenCalled();
  });

  it("lists every kind newest first, the unread marked, with a way to mark them all read", async () => {
    await show();
    expect(getAlerts).toHaveBeenCalledWith(null, 1, "token-abc", "9.9.9.9");
    expect(entries().map((entry) => [entry.querySelector("h2")!.textContent, entry.hasAttribute("data-unread")])).toEqual([
      ["2 new lots match your saved searches", true],
      ["A saved lot changed · Auction date set and Buy now price changed", false],
      ["Auction reminder, 1 hour before", false],
    ]);
    expect(screen.getByRole("button", { name: "Mark all as read" })).toBeTruthy();
  });

  it("groups new matches by search, each lot once with the other searches it matches, and links the rest", async () => {
    await show();
    const [acuras, cheap] = within(entries()[0]).getAllByRole("region");
    expect(within(acuras).getByRole("heading", { level: 3 }).textContent).toBe("Acuras: 1 new lot");
    expect(within(acuras).getByRole("link", { name: "2013 ACURA TSX" }).getAttribute("href")).toBe("/active-lots/copart/41633106");
    expect(acuras.textContent).toContain("Lot 41633106 · Copart · VALLEJO, CA · Fri, Oct 9, 3:00 PM UTC");
    expect(acuras.textContent).toContain("Also matches: Under $10k");
    expect(within(acuras).queryByRole("link", { name: /^See all/ })).toBeNull();
    expect(within(cheap).getByRole("heading", { level: 3 }).textContent).toBe("Under $10k: 14 new lots");
    expect(cheap.textContent).toContain("Lot 7 · Copart · VALLEJO, CA · Future sale");
    expect(within(cheap).getByRole("link", { name: "See all 14" }).getAttribute("href")).toBe("/active-lots?bid_max=10000");
  });

  it("says what changed on a saved lot, each new value in bold, and when a reminded auction starts", async () => {
    await show();
    const [, changes, reminder] = entries();
    expect(changes.textContent).toContain("Auction date set: Fri, Oct 9, 3:00 PM UTC");
    expect(changes.textContent).toContain("Buy now: $9,500 → not offered");
    const [date, price] = changes.querySelectorAll("strong");
    expect(date.textContent).toMatch(/^Fri, Oct 9, 3:00 PM UTC/);
    expect(price.textContent).toBe("not offered");
    expect(reminder.textContent).toContain("The auction starts Fri, Oct 9, 3:00 PM UTC");
    expect(reminder.textContent).toContain("Auction: Oct 10, 2026 → Fri, Oct 9, 3:00 PM UTC");
    expect(reminder.querySelector("strong")!.textContent).toMatch(/^Fri, Oct 9, 3:00 PM UTC/);
  });

  it("heads changes to several lots with what changed on them, a moved date over a date set", async () => {
    const moved = { sale: { from: { at: "2026-10-09T15:00:00Z", date: null }, to: { at: null, date: null } } };
    const set = { sale: { from: { at: null, date: null }, to: { at: null, date: "2026-10-12" } } };
    const several = (lots: Alert & { kind: "changes" }) => ({ items: [lots], total: 1, unread: 0 });
    getAlerts.mockResolvedValue(several({ ...CHANGES, kind: "changes", payload: { lots: [{ lot: LOT, changes: set }, { lot: HONDA, changes: moved }] } }));
    await show();
    expect(entries()[0].querySelector("h2")!.textContent).toBe("2 saved lots changed · Auction date changed");
    cleanup();
    vi.mocked(lang).mockResolvedValueOnce("es");
    getAlerts.mockResolvedValue(several({ ...CHANGES, kind: "changes", payload: { lots: [{ lot: LOT, changes: set }, { lot: HONDA, changes: { buy_now: { from: null, to: 4000 } } }] } }));
    await show();
    expect(screen.getByRole("article").querySelector("h2")!.textContent).toBe("2 lotes guardados cambiaron · Fecha de subasta fijada y cambió el precio de compra inmediata");
  });

  it("heads a day's reminder as one, and names a lot without a name by its number", async () => {
    const nameless = { ...LOT, year: null, make: null, model: null, trim: null };
    getAlerts.mockResolvedValue({
      items: [{ ...REMINDER, payload: { lot: nameless, reminders: ["day"], changes: null } }],
      total: 1,
      unread: 0,
    });
    await show();
    const [reminder] = entries();
    expect(reminder.querySelector("h2")!.textContent).toBe("Auction reminder, 1 day before");
    expect(within(reminder).getByRole("link", { name: "Lot 41633106" })).toBeTruthy();
    expect(reminder.querySelector("ul")).toBeNull();
  });

  it("shows one kind of alert, and pages through them", async () => {
    getAlerts.mockResolvedValue({ items: [REMINDER], total: 45, unread: 0 });
    await show({ kind: "reminder", page: "2" });
    expect(getAlerts).toHaveBeenCalledWith("reminder", 2, "token-abc", "9.9.9.9");
    const kinds = screen.getByRole("navigation", { name: "Kind of alert" });
    expect([...kinds.querySelectorAll("a")].map((link) => [link.textContent, link.getAttribute("href"), link.getAttribute("aria-current")])).toEqual([
      ["All", "/alerts", null],
      ["New matches", "/alerts?kind=matches", null],
      ["Lot changes", "/alerts?kind=changes", null],
      ["Reminders", "/alerts?kind=reminder", "page"],
    ]);
    expect(screen.queryByRole("button", { name: "Mark all as read" })).toBeNull();
    const pages = screen.getByRole("navigation", { name: "Pagination" });
    expect(within(pages).getByRole("link", { name: "Previous" }).getAttribute("href")).toBe("/alerts?kind=reminder");
    expect(within(pages).getByRole("link", { name: "Next" }).getAttribute("href")).toBe("/alerts?kind=reminder&page=3");
  });

  it("reads an unknown kind as all of them, and says when there are none", async () => {
    getAlerts.mockResolvedValue({ items: [], total: 0, unread: 0 });
    await show({ kind: "everything" });
    expect(getAlerts).toHaveBeenCalledWith(null, 1, "token-abc", "9.9.9.9");
    expect(screen.getByText("No alerts yet. Turn on alerts for a saved search, or changes and reminders for a saved lot.")).toBeTruthy();
    expect(screen.queryByRole("navigation", { name: "Pagination" })).toBeNull();
    cleanup();
    await show({ kind: "changes" });
    expect(screen.getByText("No alerts of this kind yet.")).toBeTruthy();
  });
});
