import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

/** Every crawler, AI search and assistant bots included, may read the whole site. */
export function buildRobots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
