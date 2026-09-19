import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

/**
 * AI search and assistant crawlers that are explicitly welcome. They are
 * covered by the "*" rule as well; naming them documents the intent and keeps
 * them allowed if the default rule is ever tightened.
 */
export const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
] as const;

const DISALLOWED = ["/api/"];

export function buildRobots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: DISALLOWED },
      { userAgent: [...AI_CRAWLERS], allow: "/", disallow: DISALLOWED },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
