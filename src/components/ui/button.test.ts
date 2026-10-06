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
  it("sizes buttons 32, 40 and 48px, the 48px one as tall as a text field", () => {
    expect(buttonVariants({ size: "sm" })).toContain("h-8");
    expect(buttonVariants()).toContain("h-10");
    expect(buttonVariants({ size: "lg" })).toContain("h-12");
    expect(buttonVariants({ size: "icon" })).toContain("size-10");
  });

  it("rounds a 32px button 6px and the others 8px, all on the radius scale", () => {
    expect(buttonVariants({ size: "sm" }).split(" ")).toContain("rounded-md");
    expect(buttonVariants().split(" ")).toContain("rounded-lg");
  });

  it("shows keyboard focus as a solid ring, not a faded one", () => {
    const classes = buttonVariants().split(" ");
    expect(classes).toContain("focus-visible:ring-ring");
    expect(classes.some((name) => name.startsWith("focus-visible:ring-ring/"))).toBe(false);
  });
});
