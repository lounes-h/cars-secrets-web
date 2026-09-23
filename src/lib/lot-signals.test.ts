import { describe, expect, it } from "vitest";
import { badges, copartCase, countdown, engineSpec, odometerStatus, titleType } from "@/lib/lot-signals";
import { sampleLot } from "@/lib/lots-fixture";

const lot = (fields: Partial<typeof sampleLot>) => ({ ...sampleLot, ...fields });

describe("badges", () => {
  it("lists the deal breakers in a fixed order, in plain words", () => {
    expect(badges(sampleLot)).toEqual([
      { label: "Runs and drives", tone: "good" },
      { label: "Keys", tone: "good" },
      { label: "CA - Salvage Certificate", tone: "warn" },
      { label: "Mileage not real", tone: "bad" },
    ]);
  });

  it("adds sale status only when it is not a pure sale", () => {
    expect(badges(lot({ sale_status: "On Minimum Bid", odometer_brand: "A" })).map((b) => b.label)).toEqual([
      "Runs and drives",
      "Keys",
      "CA - Salvage Certificate",
      "Minimum bid",
    ]);
  });

  it("colours each code by how much it should worry a buyer", () => {
    const tones = (fields: Partial<typeof sampleLot>) => badges(lot(fields)).map((b) => b.tone);
    expect(tones({ runs_drives: "Vehicle Starts", has_keys: "NO", title_type: "CD", title_state: "FL", odometer_brand: "E" })).toEqual([
      "warn",
      "warn",
      "bad",
      "warn",
    ]);
    expect(tones({ runs_drives: "DEFAULT", has_keys: "YES", title_type: "CT", title_state: "AL", odometer_brand: "A" })).toEqual([
      "bad",
      "good",
      "good",
    ]);
  });

  it("shows an unknown code as it came, neutral, rather than guessing", () => {
    expect(odometerStatus(lot({ odometer_brand: " ZZ " }))).toEqual({ label: "ZZ", tone: "neutral" });
    expect(odometerStatus(lot({ odometer_brand: null })).label).toBe("Mileage status not stated");
  });
});

describe("titleType", () => {
  it("reads as copart.com shows it: the state, then Copart's wording for that state's code", () => {
    // Lot 63059096 on copart.com: "OR - Lien Papers Salvage"; the export says only "OR", "LS".
    expect(titleType(lot({ title_type: "LS", title_state: "OR" }))).toEqual({ label: "OR - Lien Papers Salvage", tone: "warn" });
    expect(titleType(lot({ title_type: " sc ", title_state: " wv " })).label).toBe("WV - Salvage Certificate");
  });

  it("words and colours a code by its state, since Copart does", () => {
    expect(titleType(lot({ title_type: "DV", title_state: "OH" }))).toEqual({ label: "OH - Dis/dlr/exp Only Clean Title", tone: "good" });
    expect(titleType(lot({ title_type: "DV", title_state: "FL" }))).toEqual({ label: "FL - Derelict Vehicle Certificate", tone: "bad" });
  });

  it("shows a pair it has no wording for as the code, neutral", () => {
    expect(titleType(lot({ title_type: "ZZ", title_state: "OR" }))).toEqual({ label: "OR - ZZ", tone: "neutral" });
    expect(titleType(lot({ title_type: "LS", title_state: null }))).toEqual({ label: "LS", tone: "neutral" });
  });

  it("says so when the auction gives no title code", () => {
    expect(titleType(lot({ title_type: null }))).toEqual({ label: "Title not stated", tone: "neutral" });
    expect(titleType(lot({ title_type: "  " })).label).toBe("Title not stated");
  });
});

describe("copartCase", () => {
  it("capitalises each space-separated word the way copart.com does", () => {
    expect(copartCase("DIS/DLR/EXP LIEN PAPERS-SALV")).toBe("Dis/dlr/exp Lien Papers-salv");
    expect(copartCase("CERT OF TITLE - SALVAGE")).toBe("Cert Of Title - Salvage");
    expect(copartCase("WRECKER'S NOTICE (PARTS ONLY)")).toBe("Wrecker's Notice (Parts Only)");
    expect(copartCase("CERT OF SALVAGE > 75% DAMAGE")).toBe("Cert Of Salvage > 75% Damage");
  });
});

describe("countdown", () => {
  const now = new Date("2026-09-20T12:00:00Z");

  it("is neutral with more than a day to go", () => {
    expect(countdown("2026-09-22T15:30:00Z", now)).toEqual({ label: "Sells in 2d 3h", tone: "neutral" });
  });

  it("turns amber under a day and red under an hour", () => {
    expect(countdown("2026-09-21T11:00:00Z", now)).toEqual({ label: "Sells in 23h 0m", tone: "warn" });
    expect(countdown("2026-09-20T12:45:00Z", now)).toEqual({ label: "Sells in 0h 45m", tone: "bad" });
  });

  it("says when the sale time has passed, and ignores a time it cannot read", () => {
    expect(countdown("2026-09-20T11:00:00Z", now)?.label).toBe("Sale time has passed");
    expect(countdown("soon", now)).toBeNull();
  });
});

describe("engineSpec", () => {
  it("merges displacement and cylinders", () => {
    expect(engineSpec(sampleLot)).toBe("2.4L 4-cyl");
    expect(engineSpec(lot({ engine: "3.5L", cylinders: "6" }))).toBe("3.5L 6-cyl");
  });

  it("uses whichever half the auction published", () => {
    expect(engineSpec(lot({ cylinders: null }))).toBe("2.4L 4");
    expect(engineSpec(lot({ engine: null }))).toBe("4-cyl");
    expect(engineSpec(lot({ engine: null, cylinders: null }))).toBe("—");
  });
});
