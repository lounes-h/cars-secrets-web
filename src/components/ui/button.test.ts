import { describe, expect, it } from "vitest";
import { buttonVariants } from "@/components/ui/button";

describe("buttonVariants", () => {
  it("lets a variant's border beat the base's transparent one, on a link drawn as a button too", () => {
    const outline = buttonVariants({ variant: "outline", className: "mt-2" }).split(" ");
    expect(outline).toContain("border-border");
    expect(outline).not.toContain("border-transparent");
    expect(outline).toContain("mt-2");
  });
});
