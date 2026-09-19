// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { readRememberedEmail, rememberEmail } from "@/lib/remembered-email";

afterEach(() => {
  window.sessionStorage.clear();
  vi.restoreAllMocks();
});

describe("remembered email", () => {
  it("keeps the last address typed in this tab, trimmed", () => {
    expect(readRememberedEmail()).toBe("");
    rememberEmail("  dana@example.com ");
    expect(readRememberedEmail()).toBe("dana@example.com");
    rememberEmail("   ");
    expect(readRememberedEmail()).toBe("dana@example.com");
  });

  it("works without storage", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(() => rememberEmail("dana@example.com")).not.toThrow();
    expect(readRememberedEmail()).toBe("");
  });
});
