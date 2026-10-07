import { lang } from "next/root-params";
import { describe, expect, it, vi } from "vitest";
import { actionI18n, getI18n } from "@/lib/i18n-server";
import { en } from "@/messages/en";
import { es } from "@/messages/es";

const cookie = vi.hoisted(() => ({ value: undefined as string | undefined }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => (cookie.value ? { value: cookie.value } : undefined) }) }));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NOT FOUND");
  },
}));

describe("getI18n", () => {
  it("reads the page's language from its [lang] segment", async () => {
    expect(await getI18n()).toEqual({ locale: "en", m: en });
    vi.mocked(lang).mockResolvedValueOnce("es");
    expect(await getI18n()).toEqual({ locale: "es", m: es });
  });

  it("is a 404 for a segment that is no language", async () => {
    vi.mocked(lang).mockResolvedValueOnce("fr");
    await expect(getI18n()).rejects.toThrow("NOT FOUND");
  });
});

describe("actionI18n", () => {
  it("takes the language the proxy remembered, English when there is none or it is unknown", async () => {
    expect((await actionI18n()).locale).toBe("en");
    cookie.value = "es";
    expect(await actionI18n()).toEqual({ locale: "es", m: es });
    cookie.value = "constructor";
    expect((await actionI18n()).locale).toBe("en");
  });
});
