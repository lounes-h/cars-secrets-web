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

describe("the control scale", () => {
  it("sizes buttons 32, 40, 48 and 55px, the 48px one as tall as a text field", () => {
    expect(buttonVariants({ size: "sm" })).toContain("h-8");
    expect(buttonVariants()).toContain("h-10");
    expect(buttonVariants({ size: "lg" })).toContain("h-12");
    expect(buttonVariants({ size: "xl" })).toContain("h-[55px]");
    expect(buttonVariants({ size: "icon" })).toContain("size-10");
  });
});
