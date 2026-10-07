import { describe, expect, it } from "vitest";
import { badges, copartCase, countdown, driveType, engineSpec, odometerStatus, sellerType, titleType, vehicleType } from "@/lib/lot-signals";
import { sampleLot } from "@/lib/lots-fixture";
import { en } from "@/messages/en";

const lot = (fields: Partial<typeof sampleLot>) => ({ ...sampleLot, ...fields });

describe("badges", () => {
  it("lists the deal breakers in a fixed order, in plain words", () => {
    expect(badges(sampleLot, en)).toEqual([
      { label: "Runs and drives", tone: "good" },
      { label: "Keys", tone: "good" },
      { label: "CA - Salvage Certificate", tone: "warn" },
      { label: "Mileage not real", tone: "bad" },
      { label: "Pure sale", tone: "good" },
      { label: "Insurance seller", tone: "good" },
    ]);
  });

  it("always shows the sale status, a pure sale included, just before the seller", () => {
    const last = (sale_status: string | null) => badges(lot({ sale_status }), en).at(-2);
    expect(last("On Minimum Bid")).toEqual({ label: "Minimum bid", tone: "warn" });
    expect(last("On Approval")).toEqual({ label: "Seller must approve", tone: "warn" });
    expect(last("Pure Sale")).toEqual({ label: "Pure sale", tone: "good" });
    expect(last(null)).toEqual({ label: "Sale status not stated", tone: "neutral" });
  });

  it("colours each code by how much it should worry a buyer", () => {
    const tones = (fields: Partial<typeof sampleLot>) => badges(lot(fields), en).map((b) => b.tone);
    expect(tones({ runs_drives: "Vehicle Starts", has_keys: "NO", title_type: "CD", title_state: "FL", odometer_brand: "E" })).toEqual([
      "warn",
      "warn",
      "bad",
      "warn",
      "good",
      "good",
    ]);
    expect(tones({ runs_drives: "DEFAULT", has_keys: "YES", title_type: "CT", title_state: "AL", odometer_brand: "A", seller_name: null })).toEqual([
      "bad",
      "good",
      "good",
      "good", // no seller named, so no seller badge
    ]);
  });

  it("ends with an offsite badge when the lot is held away from the yard, and none at the yard", () => {
    expect(badges(lot({ offsite_address: "645 W UNION ST", offsite_city: "ALLENTOWN", offsite_state: "PA", offsite_zip: "18101" }), en).at(-1)).toEqual({ label: "Offsite", tone: "warn" });
    expect(badges(lot({ offsite_city: "ALLENTOWN" }), en).at(-1)).toEqual({ label: "Offsite", tone: "warn" });
    expect(badges(sampleLot, en).map((badge) => badge.label)).not.toContain("At the yard");
  });

  it("shows an unknown code as it came, neutral, rather than guessing", () => {
    expect(odometerStatus(lot({ odometer_brand: " ZZ " }), en)).toEqual({ label: "ZZ", tone: "neutral" });
    expect(odometerStatus(lot({ odometer_brand: null }), en).label).toBe("Mileage status not stated");
  });
});

describe("titleType", () => {
  it("reads as copart.com shows it: the state, then Copart's wording for that state's code", () => {
    // Lot 63059096 on copart.com: "OR - Lien Papers Salvage"; the export says only "OR", "LS".
    expect(titleType(lot({ title_type: "LS", title_state: "OR" }), en)).toEqual({ label: "OR - Lien Papers Salvage", tone: "warn" });
    expect(titleType(lot({ title_type: " sc ", title_state: " wv " }), en).label).toBe("WV - Salvage Certificate");
  });

  it("words and colours a code by its state, since Copart does", () => {
    expect(titleType(lot({ title_type: "DV", title_state: "OH" }), en)).toEqual({ label: "OH - Dis/dlr/exp Only Clean Title", tone: "good" });
    expect(titleType(lot({ title_type: "DV", title_state: "FL" }), en)).toEqual({ label: "FL - Derelict Vehicle Certificate", tone: "bad" });
  });

  it("shows a pair it has no wording for as the code, neutral", () => {
    expect(titleType(lot({ title_type: "ZZ", title_state: "OR" }), en)).toEqual({ label: "OR - ZZ", tone: "neutral" });
    expect(titleType(lot({ title_type: "LS", title_state: null }), en)).toEqual({ label: "LS", tone: "neutral" });
  });

  it("says so when the auction gives no title code", () => {
    expect(titleType(lot({ title_type: null }), en)).toEqual({ label: "Title not stated", tone: "neutral" });
    expect(titleType(lot({ title_type: "  " }), en).label).toBe("Title not stated");
  });
});

describe("sellerType", () => {
  const seller = (seller_name: string | null) => sellerType(lot({ seller_name }), en);

  it("marks an insurer, named with the word or by its brand", () => {
    // Seller names seen in Copart's export and on copart.com.
    for (const name of ["State Farm Insurance", "GEICO", "Progressive", "USAA", "CSAA", "Insurance Vehicle", "DELAWARE VALLEY INS. TRUST", "AMERICAN ROAD INSURANCE CO"]) {
      expect(seller(name), name).toEqual({ label: "Insurance seller", tone: "good" });
    }
  });

  it("says a named seller that is not an insurer is not one", () => {
    for (const name of ["CAPITAL ONE AUTO", "HERTZ SV", "ENTERPRISE-LOGO.jpeg", "Trusted Dealer", "NATIONWIDE ACCEPTANCE LLC"]) {
      expect(seller(name), name).toEqual({ label: "Not an insurance seller", tone: "neutral" });
    }
  });

  it("gives no badge when the auction names no seller", () => {
    for (const seller_name of [null, "  "]) {
      expect(sellerType(lot({ seller_name }), en)).toEqual({ label: "Seller not stated", tone: "neutral", badge: false });
      expect(badges(lot({ seller_name }), en).map((badge) => badge.label)).not.toContain("Seller not stated");
    }
  });
});

describe("vehicleType", () => {
  it("words Copart's one-letter codes as copart.com does", () => {
    const type = (vehicle_type: string | null) => vehicleType(lot({ vehicle_type }), en);
    expect(type("V")).toBe("Automobile");
    expect(type(" k ")).toBe("Medium duty / box truck");
    expect(type("R")).toBe("Recreational vehicle (RV)");
    expect(type("J")).toBe("Jet ski");
  });

  it("shows a code it does not know as it came, and nothing for none", () => {
    expect(vehicleType(lot({ vehicle_type: " Z " }), en)).toBe("Z");
    expect(vehicleType(lot({ vehicle_type: " " }), en)).toBeNull();
    expect(vehicleType(lot({ vehicle_type: null }), en)).toBeNull();
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
    expect(countdown("2026-09-22T15:30:00Z", now, en)).toEqual({ label: "Sells in 2d 3h", tone: "neutral" });
  });

  it("turns amber under a day and red under an hour", () => {
    expect(countdown("2026-09-21T11:00:00Z", now, en)).toEqual({ label: "Sells in 23h 0m", tone: "warn" });
    expect(countdown("2026-09-20T12:45:00Z", now, en)).toEqual({ label: "Sells in 0h 45m", tone: "bad" });
  });

  it("says when the sale time has passed, and ignores a time it cannot read", () => {
    expect(countdown("2026-09-20T11:00:00Z", now, en)?.label).toBe("Sale time has passed");
    expect(countdown("soon", now, en)).toBeNull();
  });
});

describe("engineSpec", () => {
  it("merges displacement and cylinders", () => {
    expect(engineSpec(sampleLot, en)).toBe("2.4L 4-cyl");
    expect(engineSpec(lot({ engine: "3.5L", cylinders: "6" }), en)).toBe("3.5L 6-cyl");
  });

  it("uses whichever half the auction published", () => {
    expect(engineSpec(lot({ cylinders: null }), en)).toBe("2.4L 4");
    expect(engineSpec(lot({ engine: null }), en)).toBe("4-cyl");
    expect(engineSpec(lot({ engine: null, cylinders: null }), en)).toBe("—");
  });
});

describe("driveType", () => {
  it("shortens the auction's words the way a dealer says them", () => {
    const drive = (value: string | null) => driveType(lot({ drive: value }));
    expect(drive("FRONT WHEEL DRIVE")).toBe("FWD");
    expect(drive("Front-wheel Drive")).toBe("FWD");
    expect(drive("REAR WHEEL DRIVE")).toBe("RWD");
    expect(drive("Rear-wheel drive")).toBe("RWD");
    expect(drive("ALL WHEEL DRIVE")).toBe("AWD");
    expect(drive("4X4 W/REAR WHEEL DRV")).toBe("4WD");
    expect(drive("4x4 w/Front Whl Drv")).toBe("4WD");
    expect(drive("FOUR BY FOUR")).toBe("4WD");
  });

  it("shows a drive it does not know as it came, and nothing for none", () => {
    const drive = (value: string | null) => driveType(lot({ drive: value }));
    expect(drive(" 4X2 ")).toBe("4X2");
    expect(drive("UNKNOWN")).toBeNull();
    expect(drive("NONE")).toBeNull();
    expect(drive("  ")).toBeNull();
    expect(drive(null)).toBeNull();
  });
});
