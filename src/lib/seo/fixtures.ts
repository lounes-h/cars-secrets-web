import type { SiteRoute } from "@/lib/routes";

/** Example registry for tests, with paths no real page has. */
export const fixtureRoutes: readonly SiteRoute<string>[] = [
  { path: "/", changeFrequency: "weekly", priority: 1, llms: true },
  { path: "/guides/max-bid", changeFrequency: "monthly", priority: 0.8, llms: true },
  { path: "/terms", changeFrequency: "yearly", priority: 0.2 },
  { path: "/reset", changeFrequency: "yearly", priority: 0.1, noindex: true },
];

/** Their titles and descriptions, as a language's `pages` would hold them. */
export const fixturePages = {
  "/": { title: "Home", description: "Home page description." },
  "/guides/max-bid": { title: "How to set a max bid", description: "Guide description." },
  "/terms": { title: "Terms", description: "Terms description." },
  "/reset": { title: "Reset", description: "Reset page description." },
};
