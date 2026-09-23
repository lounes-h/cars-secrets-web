import { describe, expect, it } from "vitest";
import { badges, countdown, engineSpec, odometerStatus, summary, titleType } from "@/lib/lot-signals";
import { sampleLot } from "@/lib/lots-fixture";

const lot = (fields: Partial<typeof sampleLot>) => ({ ...sampleLot, ...fields });

describe("badges", () => {
  it("lists the deal breakers in a fixed order, in plain words", () => {
    expect(badges(sampleLot)).toEqual([
      { label: "Runs and drives", tone: "good" },
      { label: "Keys", tone: "good" },
      { label: "Title SC", tone: "neutral" },
      { label: "Mileage not real", tone: "bad" },
    ]);
  });

  it("adds sale status only when it is not a pure sale", () => {
    expect(badges(lot({ sale_status: "On Minimum Bid", odometer_brand: "A" })).map((b) => b.label)).toEqual([
      "Runs and drives",
      "Keys",
      "Title SC",
      "Minimum bid",
    ]);
  });

  it("colours each code by how much it should worry a buyer", () => {
    const tones = (fields: Partial<typeof sampleLot>) => badges(lot(fields)).map((b) => b.tone);
    expect(tones({ runs_drives: "Vehicle Starts", has_keys: "NO", title_type: "CD", odometer_brand: "E" })).toEqual([
      "warn",
      "warn",
      "neutral",
      "warn",
    ]);
    expect(tones({ runs_drives: "DEFAULT", has_keys: "YES", title_type: "CT", odometer_brand: "A" })).toEqual([
      "bad",
      "good",
      "neutral",
    ]);
  });

  it("shows an unknown code as it came, neutral, rather than guessing", () => {
    expect(odometerStatus(lot({ odometer_brand: " ZZ " }))).toEqual({ label: "ZZ", tone: "neutral" });
    expect(odometerStatus(lot({ odometer_brand: null })).label).toBe("Mileage status not stated");
  });
});

describe("titleType", () => {
  it("spells out a code in Copart's own words, neutral", () => {
    expect(titleType(lot({ title_type: " ct " }))).toEqual({ label: "Certificate Of Title", tone: "neutral" });
  });

  it("shows a code whose wording is not confirmed as it came", () => {
    expect(titleType(lot({ title_type: " SC " }))).toEqual({ label: "Title SC", tone: "neutral" });
  });

  it("says so when the auction gives no title code", () => {
    expect(titleType(lot({ title_type: null }))).toEqual({ label: "Title not stated", tone: "neutral" });
    expect(titleType(lot({ title_type: "  " })).label).toBe("Title not stated");
  });
});

describe("summary", () => {
  it("says the deal breakers in one sentence", () => {
    expect(summary(sampleLot)).toBe("Runs and drives, front end damage, mileage not real, Title SC.");
  });

  it("mentions missing keys and leaves out what the auction did not say", () => {
    expect(summary(lot({ has_keys: "NO", damage_primary: null, odometer_brand: "A", title_type: "CT" }))).toBe(
      "Runs and drives, no keys, Certificate Of Title.",
    );
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
