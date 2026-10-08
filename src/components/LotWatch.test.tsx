// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { saveLotAction, unsaveLotAction, refresh } = vi.hoisted(() => ({
  saveLotAction: vi.fn(),
  unsaveLotAction: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock("@/app/[lang]/saved/actions", () => ({ saveLotAction, unsaveLotAction }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

const { LotWatch } = await import("@/components/LotWatch");
const { I18nProvider } = await import("@/components/I18nProvider");
const { es } = await import("@/messages/es");

const KEY = { source: "copart", lot_number: "41633106" };
const LOT = { ...KEY, sale_at: "2026-10-09T15:00:00Z", buy_it_now_price: 9500 };
const OFF = { change_alerts: false, remind_hour: false, remind_day: false };
const NOW = Date.parse("2026-10-08T12:00:00Z");

/** What the action answers once the lot is saved with these switches. */
const saved = (switches = {}) => ({ value: { lot: LOT, available: true, saved_at: "2026-10-07T00:00:00Z", ...OFF, ...switches } });

const button = (name: RegExp | string) => screen.getByRole("button", { name });
const click = (element: HTMLElement) => act(async () => fireEvent.click(element));

/** Opens Remind me, the clock reading `now`, and returns the dialog. */
async function remind(now = NOW) {
  vi.useFakeTimers({ now, toFake: ["Date"] });
  await click(button("Remind me"));
  return screen.getByRole("dialog", { name: "Remind me before the auction" });
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe("Save / Saved", () => {
  it("saves the lot with nothing switched on, and removes it again", async () => {
    saveLotAction.mockResolvedValue(saved());
    unsaveLotAction.mockResolvedValue({ value: null });
    render(<LotWatch lot={LOT} initial={null} />);

    expect(button("Save").getAttribute("aria-pressed")).toBe("false");
    await click(button("Save"));
    expect(saveLotAction).toHaveBeenCalledWith(KEY, {}, "UTC");
    expect(button("Saved").getAttribute("aria-pressed")).toBe("true");
    await click(button("Saved"));
    expect(unsaveLotAction).toHaveBeenCalledWith(KEY);
    expect(button("Save")).toBeTruthy();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("stays as it was, and says why, when the API refuses", async () => {
    saveLotAction.mockResolvedValue({ error: "An account keeps up to 500 saved lots. Remove one to save another." });
    render(<LotWatch lot={LOT} initial={null} />);

    await click(button("Save"));

    expect(button("Save").getAttribute("aria-pressed")).toBe("false");
    expect(screen.getByRole("alert").textContent).toBe("An account keeps up to 500 saved lots. Remove one to save another.");
  });

  it("stays saved, and says why, when the lot could not be removed", async () => {
    unsaveLotAction.mockResolvedValue({ error: "That did not work. Please try again." });
    render(<LotWatch lot={LOT} initial={OFF} refresh />);

    await click(button("Saved"));

    expect(button("Saved")).toBeTruthy();
    expect(screen.getByRole("alert").textContent).toBe("That did not work. Please try again.");
    expect(refresh).not.toHaveBeenCalled();
  });

  it("shows the page again once the lot is removed, where the page lists saved lots", async () => {
    unsaveLotAction.mockResolvedValue({ value: null });
    render(<LotWatch lot={LOT} initial={OFF} refresh />);

    await click(button("Saved"));

    expect(refresh).toHaveBeenCalled();
  });

  it("is a Save button alone on a lot card", () => {
    render(<LotWatch lot={LOT} initial={OFF} />);
    expect(screen.getAllByRole("button").map((one) => one.textContent)).toEqual(["Saved"]);
    expect(screen.queryByRole("checkbox")).toBeNull();
  });

  it("speaks the page's language", () => {
    render(
      <I18nProvider value={{ locale: "es", m: es }}>
        <LotWatch lot={LOT} initial={null} full now={NOW} />
      </I18nProvider>,
    );
    expect(screen.getAllByRole("button").map((one) => one.textContent)).toEqual(["Guardar", "Recordármelo"]);
  });
});

describe("change alerts", () => {
  it("are about the auction date alone for a lot without Buy now", () => {
    for (const buy_it_now_price of [null, 0]) {
      render(<LotWatch lot={{ ...LOT, buy_it_now_price }} initial={OFF} full now={NOW} />);
      expect(screen.getByRole("checkbox", { name: "Email me when the auction date changes" })).toBeTruthy();
      cleanup();
    }
  });

  it("are offered once the lot is saved, and switched there", async () => {
    saveLotAction.mockResolvedValue(saved({ change_alerts: true }));
    const { rerender } = render(<LotWatch lot={LOT} initial={null} full now={NOW} />);
    expect(screen.queryByRole("checkbox")).toBeNull();
    rerender(<LotWatch key="saved" lot={LOT} initial={OFF} full now={NOW} />);

    const alerts = screen.getByRole("checkbox", { name: "Email me when the auction date or Buy now price changes" });
    expect(alerts.getAttribute("aria-checked")).toBe("false");
    await click(alerts);

    expect(saveLotAction).toHaveBeenCalledWith(KEY, { change_alerts: true }, "UTC");
    expect(alerts.getAttribute("aria-checked")).toBe("true");
  });
});

describe("Remind me", () => {
  it("offers 1 hour before the auction, checked, and 1 day before, each at its time in the dealer's zone", async () => {
    saveLotAction.mockResolvedValue(saved({ remind_hour: true }));
    render(<LotWatch lot={LOT} initial={null} full now={NOW} />);

    const dialog = await remind();

    expect(dialog.textContent).toContain("The auction starts Fri, Oct 9, 3:00 PM UTC.");
    const hour = within(dialog).getByRole("checkbox", { name: /^1 hour before the auction/ });
    const day = within(dialog).getByRole("checkbox", { name: /^1 day before the auction/ });
    expect([hour.getAttribute("aria-checked"), day.getAttribute("aria-checked")]).toEqual(["true", "false"]);
    expect(hour.closest("[data-slot=field]")!.textContent).toContain("Fri, Oct 9, 2:00 PM UTC");
    expect(day.closest("[data-slot=field]")!.textContent).toContain("Thu, Oct 8, 3:00 PM UTC");
    expect(dialog.textContent).toContain("Reminders are for the auction's scheduled start, not for when this lot comes up.");
    expect(dialog.textContent).toContain("Saving reminders also saves this lot.");

    await click(within(dialog).getByRole("button", { name: "Save reminders" }));

    expect(saveLotAction).toHaveBeenCalledWith(KEY, { remind_hour: true, remind_day: false }, "UTC");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(button("Saved")).toBeTruthy();
    expect(screen.getByText("Reminders: 1 hour before")).toBeTruthy();
  });

  it("marks a reminder whose time has passed, and leaves it off", async () => {
    render(<LotWatch lot={LOT} initial={OFF} full now={NOW} />);

    const dialog = await remind(Date.parse("2026-10-08T16:00:00Z"));

    const day = within(dialog).getByRole("checkbox", { name: /^1 day before the auction/ });
    expect(day.getAttribute("aria-disabled") ?? String(day.hasAttribute("data-disabled"))).toBe("true");
    expect(day.closest("[data-slot=field]")!.textContent).toContain("Already passed");
    expect(dialog.textContent).not.toContain("Saving reminders also saves this lot.");
  });

  it("waits for the auction's time when there is none yet", async () => {
    saveLotAction.mockResolvedValue(saved({ remind_hour: true, remind_day: true }));
    const lot = { ...LOT, sale_at: null };
    render(<LotWatch lot={lot} initial={null} full now={NOW} />);

    const dialog = await remind();
    expect(dialog.textContent).toContain("The auction has no start time yet.");
    await click(within(dialog).getByRole("checkbox", { name: /^1 day before the auction/ }));
    await click(within(dialog).getByRole("button", { name: "Save reminders" }));

    expect(saveLotAction).toHaveBeenCalledWith(KEY, { remind_hour: true, remind_day: true }, "UTC");
    expect(screen.getByText("Reminders: 1 hour before, 1 day before, waiting for the auction time")).toBeTruthy();
  });

  it("opens with the reminders set, and turning them off keeps the lot saved", async () => {
    saveLotAction.mockResolvedValue(saved());
    render(<LotWatch lot={LOT} initial={{ ...OFF, remind_day: true }} full now={NOW} />);
    expect(screen.getByText("Reminders: 1 day before")).toBeTruthy();

    const dialog = await remind();
    const day = within(dialog).getByRole("checkbox", { name: /^1 day before the auction/ });
    expect(day.getAttribute("aria-checked")).toBe("true");
    expect(within(dialog).getByRole("checkbox", { name: /^1 hour before/ }).getAttribute("aria-checked")).toBe("false");
    await click(day);
    await click(within(dialog).getByRole("button", { name: "Save reminders" }));

    expect(saveLotAction).toHaveBeenCalledWith(KEY, { remind_hour: false, remind_day: false }, "UTC");
    expect(screen.queryByText(/^Reminders/)).toBeNull();
    expect(button("Saved")).toBeTruthy();
  });

  it("keeps Save reminders off while no time is chosen, so the lot is not saved", async () => {
    render(<LotWatch lot={LOT} initial={null} full now={NOW} />);

    const dialog = await remind();
    const save = within(dialog).getByRole("button", { name: "Save reminders" });
    expect(save.hasAttribute("disabled")).toBe(false);
    await click(within(dialog).getByRole("checkbox", { name: /^1 hour before/ }));
    expect(save.hasAttribute("disabled")).toBe(true);
    await click(save);

    expect(saveLotAction).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBe(dialog);
    // Behind the open dialog, so out of the accessibility tree for now: still not saved.
    expect(screen.getByRole("button", { name: "Save", hidden: true }).getAttribute("aria-pressed")).toBe("false");
  });

  it("keeps it off when every time has passed", async () => {
    render(<LotWatch lot={LOT} initial={OFF} full now={NOW} />);
    const dialog = await remind(Date.parse("2026-10-09T14:30:00Z"));
    expect(within(dialog).getByRole("button", { name: "Save reminders" }).hasAttribute("disabled")).toBe(true);
  });

  it("closes without saving anything", async () => {
    render(<LotWatch lot={LOT} initial={null} full now={NOW} />);
    const dialog = await remind();
    await click(within(dialog).getByRole("button", { name: "Close" }));
    await vi.waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(saveLotAction).not.toHaveBeenCalled();
  });

  it("offers 1 hour again, checked, once the reminders set have all gone out", async () => {
    render(<LotWatch lot={LOT} initial={{ ...OFF, remind_day: true }} full now={NOW} />);

    const dialog = await remind(Date.parse("2026-10-08T16:00:00Z"));

    expect(within(dialog).getByRole("checkbox", { name: /^1 hour before/ }).getAttribute("aria-checked")).toBe("true");
    expect(within(dialog).getByRole("checkbox", { name: /^1 day before/ }).getAttribute("aria-checked")).toBe("false");
  });

  it("says a set reminder's time has passed", () => {
    render(<LotWatch lot={LOT} initial={{ ...OFF, remind_hour: true, remind_day: true }} full now={Date.parse("2026-10-08T16:00:00Z")} />);
    expect(screen.getByText("Reminders: 1 hour before, 1 day before (passed)")).toBeTruthy();
  });

  it("stays open with the reason when they could not be saved", async () => {
    saveLotAction.mockResolvedValue({ error: "The auction no longer lists this lot." });
    render(<LotWatch lot={LOT} initial={null} full now={NOW} />);

    const dialog = await remind();
    await click(within(dialog).getByRole("button", { name: "Save reminders" }));

    expect(screen.getByRole("dialog")).toBe(dialog);
    expect(within(dialog).getByRole("alert").textContent).toBe("The auction no longer lists this lot.");
  });
});
