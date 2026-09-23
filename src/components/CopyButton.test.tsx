// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { CopyButton } from "@/components/CopyButton";

afterEach(cleanup);

it("copies the value and says so", async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.assign(navigator, { clipboard: { writeText } });
  render(<CopyButton value="JH4CU2F65DC010051" label="VIN" />);
  fireEvent.click(screen.getByRole("button", { name: "Copy VIN" }));
  expect(writeText).toHaveBeenCalledWith("JH4CU2F65DC010051");
  expect(await screen.findByText("Copied")).toBeTruthy();
});

it("does not claim a copy the browser refused", async () => {
  const writeText = vi.fn().mockRejectedValue(new Error("denied"));
  Object.assign(navigator, { clipboard: { writeText } });
  render(<CopyButton value="41633106" label="lot number" />);
  fireEvent.click(screen.getByRole("button", { name: "Copy lot number" }));
  await waitFor(() => expect(writeText).toHaveBeenCalled());
  expect(screen.getByText("Copy")).toBeTruthy();
});
