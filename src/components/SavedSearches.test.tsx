// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { saveSearchAction, updateSearchAction, deleteSearchAction, push, refresh } = vi.hoisted(() => ({
  saveSearchAction: vi.fn(),
  updateSearchAction: vi.fn(),
  deleteSearchAction: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock("@/app/[lang]/saved/actions", () => ({ saveSearchAction, updateSearchAction, deleteSearchAction }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh }) }));

const { SaveSearch, SearchControls, SearchesMenu } = await import("@/components/SavedSearches");
const { readQuery } = await import("@/lib/lot-filters");

const read = (search: string) => readQuery(new URLSearchParams(search));
const CAMRY = { id: "s1", name: "Camry", query: "make=TOYOTA&model=CAMRY", alerts: false, created_at: "2026-10-07T00:00:00Z" };

const click = (element: HTMLElement) => act(async () => fireEvent.click(element));
const dialog = (name: string) => screen.getByRole("dialog", { name });
const nameField = (within_: HTMLElement) => within(within_).getByRole("textbox", { name: "Name" }) as HTMLInputElement;
const alerts = (within_: HTMLElement) => within(within_).getByRole("checkbox", { name: /^Email me new matches/ });

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("Save search", () => {
  it("saves the filters on screen under a name drawn from them, alerts off unless asked for", async () => {
    saveSearchAction.mockResolvedValue({ value: { ...CAMRY, alerts: true } });
    render(<SaveSearch query={read("make=TOYOTA&model=CAMRY&sort=year")} searches={[]} editing={null} />);
    await click(screen.getByRole("button", { name: "Save search" }));
    const form = dialog("Save this search");
    expect(nameField(form).value).toBe("TOYOTA, CAMRY");
    expect(alerts(form).getAttribute("aria-checked")).toBe("false");
    expect(form.textContent).toContain("Lots listed from now on that match, in your search summary.");
    fireEvent.change(nameField(form), { target: { value: " My Camrys " } });
    await click(alerts(form));
    await click(within(form).getByRole("button", { name: "Save search" }));

    expect(saveSearchAction).toHaveBeenCalledWith({ name: "My Camrys", query: "make=TOYOTA&model=CAMRY", alerts: true }, "UTC");
    expect(refresh).toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("needs a name", async () => {
    render(<SaveSearch query={{}} searches={[]} editing={null} />);
    await click(screen.getByRole("button", { name: "Save search" }));
    const form = dialog("Save this search");
    expect(nameField(form).value).toBe("All lots");

    fireEvent.change(nameField(form), { target: { value: "   " } });
    await click(within(form).getByRole("button", { name: "Save search" }));

    expect(saveSearchAction).not.toHaveBeenCalled();
  });

  it("reads Edit search when the filters on screen are a saved search's, and renames or pauses it", async () => {
    updateSearchAction.mockResolvedValue({ value: { ...CAMRY, alerts: true } });
    render(<SaveSearch query={read("model=CAMRY&make=TOYOTA&sort=sale")} searches={[CAMRY]} editing={null} />);
    await click(screen.getByRole("button", { name: "Edit search" }));
    const form = dialog("Edit saved search");
    expect(nameField(form).value).toBe("Camry");
    await click(alerts(form));
    await click(within(form).getByRole("button", { name: "Save changes" }));

    expect(updateSearchAction).toHaveBeenCalledWith("s1", { name: "Camry", alerts: true }, "UTC");
    expect(refresh).toHaveBeenCalled();
  });

  it("offers to save new filters into the search being edited", async () => {
    updateSearchAction.mockResolvedValue({ value: CAMRY });
    render(<SaveSearch query={read("make=TOYOTA&title=salvage")} searches={[CAMRY]} editing={CAMRY} />);

    await click(screen.getByRole("button", { name: "Save changes" }));
    const form = dialog("Edit saved search");
    await click(within(form).getByRole("button", { name: "Save changes" }));

    expect(updateSearchAction).toHaveBeenCalledWith("s1", { name: "Camry", query: "make=TOYOTA&title=salvage", alerts: false }, "UTC");
    expect(refresh).toHaveBeenCalled();
  });

  it("or as a new search, leaving the one being edited as it was", async () => {
    saveSearchAction.mockResolvedValue({ value: { ...CAMRY, id: "s2" } });
    render(<SaveSearch query={read("make=TOYOTA&title=salvage&sort=year")} searches={[CAMRY]} editing={CAMRY} />);

    await click(screen.getByRole("button", { name: "Save changes" }));
    const form = dialog("Edit saved search");
    fireEvent.change(nameField(form), { target: { value: "Salvage Toyotas" } });
    await click(within(form).getByRole("button", { name: "Save as a new search" }));

    expect(saveSearchAction).toHaveBeenCalledWith({ name: "Salvage Toyotas", query: "make=TOYOTA&title=salvage", alerts: false }, "UTC");
    expect(updateSearchAction).not.toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith("/active-lots?make=TOYOTA&title=salvage&sort=year");
  });

  it("stays open with the reason when the search could not be saved", async () => {
    saveSearchAction.mockResolvedValue({ error: "An account keeps up to 50 saved searches. Delete one to save another." });
    render(<SaveSearch query={read("make=TOYOTA")} searches={[]} editing={null} />);

    await click(screen.getByRole("button", { name: "Save search" }));
    await click(within(dialog("Save this search")).getByRole("button", { name: "Save search" }));

    expect(within(dialog("Save this search")).getByRole("alert").textContent).toBe(
      "An account keeps up to 50 saved searches. Delete one to save another.",
    );
    expect(refresh).not.toHaveBeenCalled();
  });
});

describe("the saved searches menu", () => {
  const HONDAS = { ...CAMRY, id: "s2", name: "Hondas", query: "make=HONDA" };

  it("lists each saved search, opening its lots, and marks the one on screen", async () => {
    render(<SearchesMenu query={read("model=CAMRY&make=TOYOTA&sort=year")} searches={[CAMRY, HONDAS]} />);

    await click(screen.getByRole("button", { name: "Saved searches" }));

    const items = within(screen.getByRole("menu")).getAllByRole("menuitem");
    expect(items.map((item) => [item.textContent, item.getAttribute("href"), item.getAttribute("aria-current")])).toEqual([
      ["Camry", "/active-lots?make=TOYOTA&model=CAMRY", "true"],
      ["Hondas", "/active-lots?make=HONDA", null],
    ]);
  });

  it("is not there without saved searches", () => {
    render(<SearchesMenu query={{}} searches={[]} />);
    expect(screen.queryByRole("button")).toBeNull();
  });
});

describe("a saved search's controls", () => {
  it("switch its alerts on and off", async () => {
    updateSearchAction.mockResolvedValue({ value: { ...CAMRY, alerts: true } });
    render(<SearchControls search={CAMRY} />);

    await click(screen.getByRole("checkbox", { name: "Email me new matches" }));

    expect(updateSearchAction).toHaveBeenCalledWith("s1", { alerts: true }, "UTC");
    expect(refresh).toHaveBeenCalled();
  });

  it("say why when the switch did not take", async () => {
    updateSearchAction.mockResolvedValue({ error: "That did not work. Please try again." });
    render(<SearchControls search={CAMRY} />);

    await click(screen.getByRole("checkbox", { name: "Email me new matches" }));

    expect(screen.getByRole("alert").textContent).toBe("That did not work. Please try again.");
  });

  it("edit its filters on the lot list", () => {
    render(<SearchControls search={CAMRY} />);
    expect(screen.getByRole("link", { name: "Edit filters" }).getAttribute("href")).toBe("/active-lots?make=TOYOTA&model=CAMRY&saved=s1");
  });

  it("rename it", async () => {
    updateSearchAction.mockResolvedValue({ value: { ...CAMRY, name: "Camrys" } });
    render(<SearchControls search={CAMRY} />);

    await click(screen.getByRole("button", { name: "Rename" }));
    const form = dialog("Edit saved search");
    fireEvent.change(nameField(form), { target: { value: "Camrys" } });
    await click(within(form).getByRole("button", { name: "Save changes" }));

    expect(updateSearchAction).toHaveBeenCalledWith("s1", { name: "Camrys", alerts: false }, "UTC");
  });

  it("delete it once the dealer confirms, and not before", async () => {
    deleteSearchAction.mockResolvedValue({ value: null });
    render(<SearchControls search={CAMRY} />);

    await click(screen.getByRole("button", { name: "Delete" }));
    let confirm = dialog("Delete “Camry”?");
    expect(confirm.textContent).toContain("Its alerts stop. Lots you saved stay saved.");
    await click(within(confirm).getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(deleteSearchAction).not.toHaveBeenCalled();

    await click(screen.getByRole("button", { name: "Delete" }));
    confirm = dialog("Delete “Camry”?");
    await click(within(confirm).getByRole("button", { name: "Delete search" }));

    expect(deleteSearchAction).toHaveBeenCalledWith("s1");
    expect(refresh).toHaveBeenCalled();
  });

  it("keep the confirmation open with the reason when the search could not be deleted", async () => {
    deleteSearchAction.mockResolvedValue({ error: "That did not work. Please try again." });
    render(<SearchControls search={CAMRY} />);

    await click(screen.getByRole("button", { name: "Delete" }));
    await click(within(dialog("Delete “Camry”?")).getByRole("button", { name: "Delete search" }));

    expect(within(dialog("Delete “Camry”?")).getByRole("alert").textContent).toBe("That did not work. Please try again.");
  });
});
