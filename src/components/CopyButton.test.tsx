// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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
