import { expect, it } from "vitest";
import nextConfig from "../../next.config";

it("sends the old /auctions paths to /active-lots for good", async () => {
  expect(await nextConfig.redirects?.()).toEqual([
    { source: "/auctions/:path*", destination: "/active-lots/:path*", permanent: true },
  ]);
});
