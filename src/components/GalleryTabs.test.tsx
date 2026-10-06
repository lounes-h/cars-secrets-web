// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { GalleryTabs } from "@/components/GalleryTabs";

afterEach(cleanup);

it("shows the photos first and switches to the damage map and back", () => {
  render(<GalleryTabs photos={<p>the photos</p>} damageMap={<p>the map</p>} />);
  // Both panels stay mounted, so a photo already loaded is not fetched again.
  const [photos, map] = screen.getAllByRole("tabpanel", { hidden: true });
  expect(screen.getByRole("tabpanel", { name: "Photos" })).toBe(photos);
  expect([photos.hidden, map.hidden]).toEqual([false, true]);
  expect(screen.getByRole("tab", { name: "Photos" }).getAttribute("aria-selected")).toBe("true");

  fireEvent.click(screen.getByRole("tab", { name: "Damage map" }));
  expect([photos.hidden, map.hidden]).toEqual([true, false]);
  expect(screen.getByRole("tabpanel", { name: "Damage map" })).toBe(map);
  expect(screen.getByRole("tab", { name: "Damage map" }).getAttribute("aria-selected")).toBe("true");

  fireEvent.click(screen.getByRole("tab", { name: "Photos" }));
  expect([photos.hidden, map.hidden]).toEqual([false, true]);
});
