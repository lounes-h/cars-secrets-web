// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Query } from "@/lib/lot-filters";

const { push, refresh, lotCountsAction, rememberLotFiltersAction } = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  lotCountsAction: vi.fn(),
  rememberLotFiltersAction: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh }) }));
vi.mock("@/app/active-lots/actions", () => ({ lotCountsAction, rememberLotFiltersAction }));

const { LotFilters } = await import("@/components/LotFilters");

const COUNTS = {
  title: [
    { value: "salvage", count: 70 },
    { value: "clean", count: 26 },
  ],
  damage: [
    { value: "FRONT END", count: 47 },
    { value: "SIDE", count: 13 },
  ],
  source: [{ value: "copart", count: 100 }],
  make: [
    { value: "TOYOTA", count: 20 },
    { value: "HONDA", count: 10 },
  ],
  model: [{ value: "RAV4", count: 5 }],
  buy_now: [{ value: "yes", count: 19 }],
  sale: [{ value: "next_week", count: 40 }],
};

function show(query: Query = {}, { total = 145, usage = {}, remembered = "" }: { total?: number; usage?: Record<string, number>; remembered?: string } = {}) {
  return render(
    <LotFilters query={query} total={total} usage={usage} remembered={remembered}>
      <table aria-label="Lots" />
    </LotFilters>,
  );
}

/** A filter's button in the bar. */
const trigger = (label: RegExp) => screen.getByRole("button", { name: label });

/** Opens a filter of the bar, as clicking its button does, and returns its options. */
async function open(label: RegExp) {
  await act(async () => fireEvent.click(trigger(label)));
  return screen.getByRole("dialog");
}

/** Opens "All filters". */
async function openPanel() {
  await act(async () => fireEvent.click(screen.getByRole("button", { name: /All filters/ })));
  return panel();
}

const panel = () => screen.getByRole("dialog", { name: "All filters" });
const checked = (box: HTMLElement) => box.getAttribute("aria-checked") === "true";

beforeEach(() => {
  lotCountsAction.mockImplementation(async (_search: string, names: string[]) =>
    Object.fromEntries(Object.entries(COUNTS).filter(([name]) => names.includes(name))),
  );
  document.cookie = "cs_tz=UTC; path=/";
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("the search", () => {
  it("searches the words typed, keeping the filters, from the first page", () => {
    show({ title: ["clean"] });
    fireEvent.change(screen.getByRole("searchbox", { name: "Search lots" }), { target: { value: " 2019 rav4 " } });
    fireEvent.submit(screen.getByRole("search"));
    expect(push).toHaveBeenCalledWith("/active-lots?q=2019+rav4&title=clean&sort=newest", { scroll: false });
  });

  it("drops the search when the box is emptied", () => {
    show({ q: ["hybrid"], sort: ["year"] });
    const box = screen.getByRole("searchbox", { name: "Search lots" }) as HTMLInputElement;
    expect(box.value).toBe("hybrid");
    fireEvent.change(box, { target: { value: "" } });
    fireEvent.submit(screen.getByRole("search"));
    expect(push).toHaveBeenCalledWith("/active-lots?sort=year", { scroll: false });
  });
});

describe("the bar", () => {
  it("shows sale date, title, condition and damage, all filters and the order", () => {
    show();
    for (const label of ["Sale date", "Title", "Runs and drives", "Damage"]) {
      expect(trigger(new RegExp(`^${label}`))).toBeTruthy();
    }
    expect(screen.getByRole("button", { name: /All filters/ })).toBeTruthy();
    expect((screen.getByRole("combobox", { name: "Sort" }) as HTMLSelectElement).value).toBe("newest");
    expect(screen.getByText("145 lots")).toBeTruthy();
  });

  it("puts the search on the filters' line, and the order on the count's", () => {
    show();
    const line = screen.getByRole("search").parentElement!;
    // The filters together, after the search, so they can sit at the line's right end.
    const filters = trigger(/^Title/).parentElement!;
    expect(filters.parentElement).toBe(line);
    expect(filters.contains(screen.getByRole("button", { name: /All filters/ }))).toBe(true);
    expect(screen.getByRole("search").nextElementSibling).toBe(filters);
    const sort = screen.getByRole("combobox", { name: "Sort" });
    expect(line.contains(sort)).toBe(false);
    expect(screen.getByText("145 lots").parentElement!.contains(sort)).toBe(true);
  });

  it("counts a title's options when it is opened, and takes a choice", async () => {
    show({ run: ["verified"] });
    await open(/^Title/);
    expect(lotCountsAction).toHaveBeenCalledWith("run=verified", ["title"]);
    const salvage = await screen.findByRole("checkbox", { name: /Salvage\s*70/ });
    // No non-repairable lot with the other filters: listed, but off.
    expect(screen.getByRole("checkbox", { name: /Non-repairable\s*0/ }).getAttribute("aria-disabled")).toBe("true");
    fireEvent.click(salvage);
    expect(push).toHaveBeenCalledWith("/active-lots?title=salvage&run=verified&sort=newest", { scroll: false });
  });

  it("takes a choice back", async () => {
    show({ title: ["salvage", "clean"], sort: ["sale"] });
    await open(/^Title/);
    fireEvent.click(await screen.findByRole("checkbox", { name: /Salvage\s*70/ }));
    expect(push).toHaveBeenCalledWith("/active-lots?title=clean&sort=sale", { scroll: false });
  });

  it("lists damage types as the counts find them, and keeps a choice no lot has any more", async () => {
    let answer: (facets: object) => void = () => {};
    lotCountsAction.mockImplementationOnce(() => new Promise((resolve) => (answer = resolve)));
    show({ damage: ["HAIL"] });
    const menu = await open(/^Damage/);
    expect(within(menu).getByText("Loading…")).toBeTruthy();
    await act(async () => answer({ damage: COUNTS.damage }));
    await within(menu).findByRole("checkbox", { name: /FRONT END\s*47/ });
    const labels = within(menu).getAllByRole("checkbox").map((box) => box.closest("[data-slot=field]")!.textContent);
    expect(labels).toEqual(["FRONT END47", "SIDE13", "HAIL0"]);
    expect(checked(within(menu).getByRole("checkbox", { name: /HAIL/ }))).toBe(true);
  });

  it("chooses one sale date, or any", async () => {
    show({ sale: ["today"] });
    const menu = await open(/^Sale date/);
    fireEvent.click(within(menu).getByRole("radio", { name: /Next week/ }));
    expect(push).toHaveBeenLastCalledWith("/active-lots?sale=next_week&sort=newest", { scroll: false });
    fireEvent.click(within(menu).getByRole("radio", { name: "Any day" }));
    expect(push).toHaveBeenLastCalledWith("/active-lots?sort=newest", { scroll: false });
  });

  it("changes the order", () => {
    show({ title: ["clean"] });
    fireEvent.change(screen.getByRole("combobox", { name: "Sort" }), { target: { value: "mileage" } });
    expect(push).toHaveBeenCalledWith("/active-lots?title=clean&sort=mileage", { scroll: false });
  });

  it("moves the dealer's most used filters into the bar", () => {
    show({}, { usage: { state: 5 } });
    expect(trigger(/^State or province/)).toBeTruthy();
  });

  it("promotes a range too, which has nothing to count", async () => {
    show({ year_min: ["2018"] }, { usage: { year_min: 4 } });
    expect(trigger(/^Year/).textContent).toContain("· 1");
    const menu = await open(/^Year/);
    expect(within(menu).getByLabelText("From")).toBeTruthy();
    expect(lotCountsAction).not.toHaveBeenCalled();
  });

  it("shows how many filters are chosen, in the bar and behind All filters", () => {
    show({ title: ["clean", "salvage"], state: ["CA"], year_min: ["2018"] });
    expect(trigger(/^Title/).textContent).toContain("· 2");
    expect(screen.getByRole("button", { name: /All filters · 2/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Filters · 3/ })).toBeTruthy();
  });

  it("closes an open filter on Escape, and asks for no counts once closed", async () => {
    show();
    const menu = await open(/^Title/);
    await act(async () => fireEvent.keyDown(menu, { key: "Escape" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(lotCountsAction).toHaveBeenCalledTimes(1);
  });

  it("keeps counting a filter opened while another closes", async () => {
    show();
    await open(/^Title/);
    await open(/^Damage/);
    expect(lotCountsAction).toHaveBeenLastCalledWith("", ["damage"]);
    expect(await screen.findByRole("checkbox", { name: /FRONT END\s*47/ })).toBeTruthy();
  });

  it("ignores counts that arrive after the filters changed", async () => {
    let answer: (facets: object) => void = () => {};
    lotCountsAction.mockImplementationOnce(() => new Promise((resolve) => (answer = resolve)));
    const view = show({ title: ["clean"] });
    await open(/^Title/);
    view.rerender(
      <LotFilters query={{ title: ["salvage"] }} total={3} usage={{}} remembered="">
        <table aria-label="Lots" />
      </LotFilters>,
    );
    await act(async () => answer({ title: [{ value: "clean", count: 999 }] }));
    expect(screen.queryByText("999")).toBeNull();
    await screen.findByRole("checkbox", { name: /Salvage\s*70/ });
  });
});

describe("the chips", () => {
  it("remove one filter, or all of them but the order", () => {
    show({ q: ["hybrid"], title: ["salvage"], sort: ["year"] }, { total: 1 });
    expect(screen.getByText("1 lot")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Remove Salvage title" }));
    expect(push).toHaveBeenLastCalledWith("/active-lots?q=hybrid&sort=year", { scroll: false });
    fireEvent.click(screen.getByRole("button", { name: "Clear all" }));
    expect(push).toHaveBeenLastCalledWith("/active-lots?sort=year", { scroll: false });
  });

  it("are none, and nothing to clear, without filters", () => {
    show({ sort: ["year"] });
    expect(screen.queryByRole("button", { name: "Clear all" })).toBeNull();
  });
});

describe("All filters", () => {
  it("opens with every filter grouped, and counts them all", async () => {
    show();
    await openPanel();
    expect(lotCountsAction).toHaveBeenCalledWith("", expect.arrayContaining(["title", "damage", "state", "buy_now", "make"]));
    for (const group of ["Sale date, title and damage", "The car", "Condition", "The sale", "Where"]) {
      expect(within(panel()).getByRole("heading", { name: group, hidden: true })).toBeTruthy();
    }
    await within(panel()).findByRole("checkbox", { name: /Buy now available\s*19/, hidden: true });
    // Every lot comes from one auction: nothing to choose.
    expect(within(panel()).queryByText("Auction")).toBeNull();
    // A model is chosen within a make.
    expect(within(panel()).queryByRole("combobox", { name: "Model", hidden: true })).toBeNull();
  });

  it("shows the auctions once there is a choice", async () => {
    lotCountsAction.mockResolvedValue({ source: [{ value: "copart", count: 9 }, { value: "iaa", count: 4 }] });
    show();
    await openPanel();
    expect(await within(panel()).findByRole("checkbox", { name: /IAA\s*4/, hidden: true })).toBeTruthy();
  });

  it("keeps a chosen auction listed", async () => {
    show({ source: ["copart"] });
    expect(within(await openPanel()).getByRole("checkbox", { name: /Copart/, hidden: true })).toBeTruthy();
  });

  it("chooses a make, which drops a model of another, and then a model", async () => {
    show({ make: ["HONDA"], model: ["CIVIC"] });
    await openPanel();
    const make = within(panel()).getByRole("combobox", { name: "Make", hidden: true });
    await within(make).findByRole("option", { name: "TOYOTA (20)", hidden: true });
    fireEvent.change(make, { target: { value: "TOYOTA" } });
    expect(push).toHaveBeenLastCalledWith("/active-lots?make=TOYOTA&sort=newest", { scroll: false });
    fireEvent.change(within(panel()).getByRole("combobox", { name: "Model", hidden: true }), { target: { value: "" } });
    expect(push).toHaveBeenLastCalledWith("/active-lots?make=HONDA&sort=newest", { scroll: false });
    fireEvent.change(make, { target: { value: "" } });
    expect(push).toHaveBeenLastCalledWith("/active-lots?sort=newest", { scroll: false });
  });

  it("applies a range together, and clears a bound left empty", async () => {
    show({ year_max: ["2020"] });
    await openPanel();
    const from = within(panel()).getByLabelText("From", { selector: "#panel-year-year_min" });
    fireEvent.change(from, { target: { value: "2016" } });
    fireEvent.change(within(panel()).getByLabelText("To", { selector: "#panel-year-year_max" }), { target: { value: "" } });
    fireEvent.submit(from.closest("form")!);
    expect(push).toHaveBeenCalledWith("/active-lots?year_min=2016&sort=newest", { scroll: false });
    const miles = within(panel()).getByLabelText("Up to (miles)");
    fireEvent.change(miles, { target: { value: "90000" } });
    fireEvent.submit(miles.closest("form")!);
    expect(push).toHaveBeenLastCalledWith("/active-lots?year_max=2020&odometer_max=90000&sort=newest", { scroll: false });
  });

  it("switches Buy now on and off", async () => {
    const view = show();
    await openPanel();
    fireEvent.click(within(panel()).getByRole("checkbox", { name: /Buy now available/, hidden: true }));
    expect(push).toHaveBeenLastCalledWith("/active-lots?buy_now=1&sort=newest", { scroll: false });
    view.unmount();
    show({ buy_now: ["1"] });
    await openPanel();
    fireEvent.click(within(panel()).getByRole("checkbox", { name: /Buy now available/, hidden: true }));
    expect(push).toHaveBeenLastCalledWith("/active-lots?sort=newest", { scroll: false });
  });

  it("closes from its button or its cross, and stops asking for counts", async () => {
    show({}, { total: 1234 });
    await openPanel();
    await act(async () => fireEvent.click(within(panel()).getByRole("button", { name: "Show 1,234 lots" })));
    expect(screen.queryByRole("dialog", { name: "All filters" })).toBeNull();
    await openPanel();
    await act(async () => fireEvent.click(within(panel()).getByRole("button", { name: "Close" })));
    expect(screen.queryByRole("dialog", { name: "All filters" })).toBeNull();
    expect(lotCountsAction).toHaveBeenCalledTimes(2);
  });
});

describe("remembering", () => {
  it("keeps the filters and order for the dealer's next visit when they changed", () => {
    show({ q: ["hybrid"], title: ["clean"], sort: ["year"] }, { remembered: "sort=year" });
    expect(rememberLotFiltersAction).toHaveBeenCalledWith("title=clean&sort=year");
  });

  it("does not store what is already kept", () => {
    show({ title: ["clean"], q: ["hybrid"] }, { remembered: "title=clean" });
    expect(rememberLotFiltersAction).not.toHaveBeenCalled();
  });
});

describe("the dealer's time zone", () => {
  it("is kept in a cookie, and a sale date filter is listed again in it", () => {
    document.cookie = "cs_tz=; max-age=0; path=/";
    show({ sale: ["today"] });
    expect(document.cookie).toContain(`cs_tz=${encodeURIComponent(Intl.DateTimeFormat().resolvedOptions().timeZone)}`);
    expect(refresh).toHaveBeenCalled();
  });

  it("lists nothing again without a sale date filter, or when the cookie already says it", () => {
    document.cookie = "cs_tz=; max-age=0; path=/";
    show();
    cleanup();
    show({ sale: ["today"] });
    expect(refresh).not.toHaveBeenCalled();
  });
});
