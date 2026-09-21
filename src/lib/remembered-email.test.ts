// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { forgetEmail, readRememberedEmail, rememberEmail } from "@/lib/remembered-email";

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

  it("keeps only a complete address, so half a one never prefills the next form", () => {
    rememberEmail("dana@example.com");
    rememberEmail("dana@ex");
    rememberEmail("dana");
    rememberEmail("");
    expect(readRememberedEmail()).toBe("dana@example.com");
  });

  it("forgets on demand", () => {
    rememberEmail("dana@example.com");
    forgetEmail();
    expect(readRememberedEmail()).toBe("");
  });

  it("works without storage", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(() => rememberEmail("dana@example.com")).not.toThrow();
    expect(() => forgetEmail()).not.toThrow();
    expect(readRememberedEmail()).toBe("");
  });
});
