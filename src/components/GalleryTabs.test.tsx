// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { GalleryTabs } from "@/components/GalleryTabs";

afterEach(cleanup);

it("shows the photos first and switches to the damage map and back", () => {
  render(<GalleryTabs photos={<p>the photos</p>} damageMap={<p>the map</p>} />);
  const photos = screen.getByRole("tabpanel", { name: "Photos" });
  const map = document.getElementById("panel-damage-map")!;
  expect([photos.hidden, map.hidden]).toEqual([false, true]);
  expect(screen.getByRole("tab", { name: "Photos" }).getAttribute("aria-selected")).toBe("true");

  fireEvent.click(screen.getByRole("tab", { name: "Damage map" }));
  expect([photos.hidden, map.hidden]).toEqual([true, false]);
  expect(screen.getByRole("tab", { name: "Damage map" }).getAttribute("aria-selected")).toBe("true");

  fireEvent.click(screen.getByRole("tab", { name: "Photos" }));
  expect([photos.hidden, map.hidden]).toEqual([false, true]);
});
