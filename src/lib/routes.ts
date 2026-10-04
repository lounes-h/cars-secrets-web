/**
 * Registry of every public, indexable page. The sitemap and llms.txt are
 * generated from it — add a route here when you add a page.
 */
export type SiteRoute = {
  path: string;
  title: string;
  description: string;
  changeFrequency: "daily" | "weekly" | "monthly" | "yearly";
  priority: number;
  /** Listed in llms.txt under "Key pages". */
  llms?: boolean;
  /** Registered (so the page is known) but kept out of the sitemap and marked noindex. */
  noindex?: boolean;
};

export const routes: readonly SiteRoute[] = [
  {
    path: "/",
    title: "Everything You Need to Know Before Buying a Car at Auction",
    description:
      "See what a Copart, IAA or Manheim lot is worth, what it will cost to own and what to bid, before the auction closes.",
    changeFrequency: "daily",
    priority: 1,
    llms: true,
  },
  {
    path: "/active-lots",
    title: "Active lots",
    description:
      "Search active lots from Copart, IAA, Manheim and other auctions, with resale value, total cost, profit and a suggested max bid.",
    changeFrequency: "daily",
    priority: 0.9,
  },
  {
    path: "/vin-lookup",
    title: "VIN lookup",
    description: "Look up a VIN to see the lot's history, condition and what it is worth before you bid on it.",
    changeFrequency: "weekly",
    priority: 0.7,
  },
  {
    path: "/best-buys",
    title: "Best buys",
    description: "The lots with the strongest projected profit and margin right now, ranked from the active auction listings.",
    changeFrequency: "daily",
    priority: 0.8,
  },
  {
    path: "/how-it-works",
    title: "How it works",
    description:
      "How auction listings turn into a buying decision: resale value, total cost, profit, margin and a max bid.",
    changeFrequency: "monthly",
    priority: 0.6,
  },
  {
    path: "/pricing",
    title: "Pricing",
    description: "What a subscription costs, and what the seven day free trial includes.",
    changeFrequency: "monthly",
    priority: 0.6,
  },
  {
    path: "/saved",
    title: "Saved lots and searches",
    description: "The lots and searches you saved, so you can come back to them before the auction closes.",
    changeFrequency: "daily",
    priority: 0.1,
    noindex: true,
  },
  {
    path: "/alerts",
    title: "Your alerts",
    description: "Alerts that tell you when a lot matching one of your saved searches comes up for auction.",
    changeFrequency: "daily",
    priority: 0.1,
    noindex: true,
  },
  {
    path: "/settings",
    title: "Settings",
    description: "Your settings: how the site works for you once you are signed in.",
    changeFrequency: "yearly",
    priority: 0.1,
    noindex: true,
  },
  {
    path: "/register",
    title: "Create your account",
    description:
      "Create an account to search auction lots from Copart, IAA and Manheim and see resale value, total cost, profit and a suggested max bid.",
    changeFrequency: "yearly",
    priority: 0.5,
  },
  {
    path: "/login",
    title: "Sign in",
    description: "Sign in with your email and password, or continue with Google or Apple.",
    changeFrequency: "yearly",
    priority: 0.5,
  },
  {
    path: "/forgot-password",
    title: "Forgot your password",
    description: "Request a password reset link by email for your account.",
    changeFrequency: "yearly",
    priority: 0.2,
  },
  {
    path: "/reset-password",
    title: "Choose a new password",
    description: "Set a new password for your account from the link we emailed you.",
    changeFrequency: "yearly",
    priority: 0.1,
    noindex: true,
  },
  {
    path: "/verify-email",
    title: "Confirm your email",
    description: "Confirm the email address of your account with the 6-digit code we emailed you.",
    changeFrequency: "yearly",
    priority: 0.1,
    noindex: true,
  },
  {
    path: "/account",
    title: "Your account",
    description: "Your account: who you are signed in as, and where to sign out.",
    changeFrequency: "yearly",
    priority: 0.1,
    noindex: true,
  },
];

export function getRoute(path: string, registry: readonly SiteRoute[] = routes): SiteRoute {
  const route = registry.find((candidate) => candidate.path === path);
  if (!route) throw new Error(`No route registered for "${path}". Add it to src/lib/routes.ts.`);
  return route;
}
