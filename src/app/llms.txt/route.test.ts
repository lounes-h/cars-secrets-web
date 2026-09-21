import { describe, expect, it } from "vitest";
import { dynamic, GET } from "./route";

describe("GET /llms.txt", () => {
  it("serves static plain text", async () => {
    const response = GET();
    expect(dynamic).toBe("force-static");
    expect(response.headers.get("content-type")).toBe("text/plain; charset=utf-8");
    expect(await response.text()).toContain("# cars-secrets.test");
  });
});
