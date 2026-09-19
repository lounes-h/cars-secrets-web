import type { SiteRoute } from "@/lib/routes";

/** Example registry for tests, since no real pages exist yet. */
export const fixtureRoutes: readonly SiteRoute[] = [
  { path: "/", title: "Home", description: "Home page description.", changeFrequency: "weekly", priority: 1, llms: true },
  {
    path: "/guides/max-bid",
    title: "How to set a max bid",
    description: "Guide description.",
    changeFrequency: "monthly",
    priority: 0.8,
    llms: true,
  },
  { path: "/terms", title: "Terms", description: "Terms description.", changeFrequency: "yearly", priority: 0.2 },
  { path: "/reset", title: "Reset", description: "Reset page description.", changeFrequency: "yearly", priority: 0.1, noindex: true },
];
