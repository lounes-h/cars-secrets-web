// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
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

/** Opens a filter of the bar, as clicking its button does. */
async function open(label: RegExp) {
  const summary = screen.getAllByText(label).find((element) => element.closest("summary"))!.closest("summary")!;
  const details = summary.parentElement as HTMLDetailsElement;
  act(() => {
    details.open = true;
    details.dispatchEvent(new Event("toggle"));
  });
  return details;
}

const panel = () => screen.getByRole("dialog", { hidden: true });

beforeAll(() => {
  // jsdom has no modal dialogs.
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function () {
    this.open = false;
    this.dispatchEvent(new Event("close"));
  };
});

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
      expect(screen.getAllByText(label).some((element) => element.closest("summary"))).toBe(true);
    }
    expect(screen.getByRole("button", { name: /All filters/ })).toBeTruthy();
    expect((screen.getByRole("combobox", { name: "Sort" }) as HTMLSelectElement).value).toBe("newest");
    expect(screen.getByText("145 lots")).toBeTruthy();
  });

  it("counts a title's options when it is opened, and takes a choice", async () => {
    show({ run: ["verified"] });
    await open(/^Title/);
    expect(lotCountsAction).toHaveBeenCalledWith("run=verified", ["title"]);
    const salvage = await screen.findByRole("checkbox", { name: /Salvage\s*70/ });
    // No non-repairable lot with the other filters: listed, but off.
    expect((screen.getAllByRole("checkbox", { name: /Non-repairable\s*0/ })[0] as HTMLInputElement).disabled).toBe(true);
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
    show({ damage: ["HAIL"] });
    const menu = await open(/^Damage/);
    expect(within(menu).getByText("Loading…")).toBeTruthy();
    await within(menu).findByRole("checkbox", { name: /FRONT END\s*47/ });
    const labels = within(menu).getAllByRole("checkbox").map((box) => box.closest("label")!.textContent);
    expect(labels).toEqual(["FRONT END47", "SIDE13", "HAIL0"]);
    expect((within(menu).getByRole("checkbox", { name: /HAIL/ }) as HTMLInputElement).checked).toBe(true);
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
    expect(screen.getAllByText("State or province").some((element) => element.closest("summary"))).toBe(true);
  });

  it("promotes a range too, which has nothing to count", async () => {
    show({ year_min: ["2018"] }, { usage: { year_min: 4 } });
    const menu = await open(/^Year/);
    expect(menu.dataset.facet).toBeUndefined();
    expect(menu.querySelector("summary")!.textContent).toContain("· 1");
    expect(lotCountsAction).not.toHaveBeenCalled();
  });

  it("shows how many filters are chosen, in the bar and behind All filters", () => {
    show({ title: ["clean", "salvage"], state: ["CA"], year_min: ["2018"] });
    expect(screen.getAllByText(/· 2/).some((element) => element.closest("summary"))).toBe(true);
    expect(screen.getByRole("button", { name: /All filters · 2/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Filters · 3/ })).toBeTruthy();
  });

  it("closes an open filter on a click elsewhere or Escape", async () => {
    show();
    const menu = await open(/^Title/);
    fireEvent.click(menu.querySelector("input")!);
    expect(menu.open).toBe(true);
    fireEvent.click(document.body);
    expect(menu.open).toBe(false);
    await open(/^Title/);
    fireEvent.keyDown(document, { key: "Enter" });
    expect(menu.open).toBe(true);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(menu.open).toBe(false);
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
    fireEvent.click(screen.getByRole("button", { name: /All filters/ }));
    expect((panel() as HTMLDialogElement).open).toBe(true);
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
    fireEvent.click(screen.getByRole("button", { name: /All filters/ }));
    expect(await within(panel()).findByRole("checkbox", { name: /IAA\s*4/, hidden: true })).toBeTruthy();
  });

  it("keeps a chosen auction listed", () => {
    show({ source: ["copart"] });
    expect(within(panel()).getByRole("checkbox", { name: /Copart/, hidden: true })).toBeTruthy();
  });

  it("chooses a make, which drops a model of another, and then a model", async () => {
    show({ make: ["HONDA"], model: ["CIVIC"] });
    fireEvent.click(screen.getByRole("button", { name: /All filters/ }));
    const make = within(panel()).getByRole("combobox", { name: "Make", hidden: true });
    await within(make).findByRole("option", { name: "TOYOTA (20)", hidden: true });
    fireEvent.change(make, { target: { value: "TOYOTA" } });
    expect(push).toHaveBeenLastCalledWith("/active-lots?make=TOYOTA&sort=newest", { scroll: false });
    fireEvent.change(within(panel()).getByRole("combobox", { name: "Model", hidden: true }), { target: { value: "" } });
    expect(push).toHaveBeenLastCalledWith("/active-lots?make=HONDA&sort=newest", { scroll: false });
    fireEvent.change(make, { target: { value: "" } });
    expect(push).toHaveBeenLastCalledWith("/active-lots?sort=newest", { scroll: false });
  });

  it("applies a range together, and clears a bound left empty", () => {
    show({ year_max: ["2020"] });
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

  it("switches Buy now on and off", () => {
    const view = show();
    fireEvent.click(within(panel()).getByRole("checkbox", { name: "Buy now available", hidden: true }));
    expect(push).toHaveBeenLastCalledWith("/active-lots?buy_now=1&sort=newest", { scroll: false });
    view.unmount();
    show({ buy_now: ["1"] });
    fireEvent.click(within(panel()).getByRole("checkbox", { name: "Buy now available", hidden: true }));
    expect(push).toHaveBeenLastCalledWith("/active-lots?sort=newest", { scroll: false });
  });

  it("closes from its button or its cross, and stops asking for counts", () => {
    show({}, { total: 1234 });
    fireEvent.click(screen.getByRole("button", { name: /All filters/ }));
    fireEvent.click(within(panel()).getByRole("button", { name: "Show 1,234 lots", hidden: true }));
    expect((panel() as HTMLDialogElement).open).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: /All filters/ }));
    fireEvent.click(within(panel()).getByRole("button", { name: "Close", hidden: true }));
    expect((panel() as HTMLDialogElement).open).toBe(false);
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
