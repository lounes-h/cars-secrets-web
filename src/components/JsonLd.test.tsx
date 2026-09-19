// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { JsonLd } from "@/components/JsonLd";

afterEach(cleanup);

describe("JsonLd", () => {
  it("renders an escaped application/ld+json script", () => {
    const { container } = render(<JsonLd data={{ "@type": "Thing", name: "</script>" }} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script?.innerHTML).toContain("\\u003c/script>");
    expect(JSON.parse(script!.innerHTML)).toEqual({ "@type": "Thing", name: "</script>" });
  });
});
