// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { markAlertReadAction } = vi.hoisted(() => ({ markAlertReadAction: vi.fn() }));
vi.mock("@/app/[lang]/alerts/actions", () => ({ markAlertReadAction }));

const { AlertEntry } = await import("@/components/AlertEntry");

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const alert = (read: boolean) => (
  <AlertEntry id={7} read={read}>
    <h2>A saved lot changed</h2>
    <a href="#lot">2013 ACURA TSX</a>
    <p>Buy now: $9,500 → $8,900</p>
  </AlertEntry>
);

function show(read: boolean) {
  return render(alert(read)).container.querySelector("article")!;
}

describe("an alert", () => {
  it("says it is unread until one of its links is followed, then marks it read once", async () => {
    const entry = show(false);
    expect(entry.hasAttribute("data-unread")).toBe(true);
    expect(entry.textContent).toContain("Unread");

    await act(async () => fireEvent.click(screen.getByText("Buy now: $9,500 → $8,900")));
    expect(markAlertReadAction).not.toHaveBeenCalled();
    await act(async () => fireEvent.click(screen.getByRole("link", { name: "2013 ACURA TSX" })));
    await act(async () => fireEvent.click(screen.getByRole("link", { name: "2013 ACURA TSX" })));

    expect(markAlertReadAction).toHaveBeenCalledTimes(1);
    expect(markAlertReadAction).toHaveBeenCalledWith(7);
    expect(entry.hasAttribute("data-unread")).toBe(false);
    expect(entry.textContent).not.toContain("Unread");
  });

  it("reads as read once the page, shown again, says so (Mark all as read)", () => {
    const { container, rerender } = render(alert(false));
    rerender(alert(true));
    expect(container.querySelector("article")!.hasAttribute("data-unread")).toBe(false);
  });

  it("asks nothing when it was read already", async () => {
    show(true);
    await act(async () => fireEvent.click(screen.getByRole("link", { name: "2013 ACURA TSX" })));
    expect(markAlertReadAction).not.toHaveBeenCalled();
  });
});
