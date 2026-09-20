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
    title: "Car's Secrets: find the lots worth buying",
    description:
      "Search active Copart, IAA and Manheim lots in one place and see, for every lot, the estimated resale value, the total cost, the projected profit and a suggested maximum bid.",
    changeFrequency: "daily",
    priority: 1,
    llms: true,
  },
  {
    path: "/register",
    title: "Create your account",
    description:
      "Register for Car's Secrets to search auction lots from Copart, IAA and Manheim and see resale value, total cost, profit and a suggested max bid.",
    changeFrequency: "yearly",
    priority: 0.5,
  },
  {
    path: "/login",
    title: "Sign in",
    description: "Sign in to Car's Secrets with your email and password, or continue with Google or Apple.",
    changeFrequency: "yearly",
    priority: 0.5,
  },
  {
    path: "/forgot-password",
    title: "Forgot your password",
    description: "Request a password reset link by email for your Car's Secrets account.",
    changeFrequency: "yearly",
    priority: 0.2,
  },
  {
    path: "/reset-password",
    title: "Choose a new password",
    description: "Set a new password for your Car's Secrets account from the link we emailed you.",
    changeFrequency: "yearly",
    priority: 0.1,
    noindex: true,
  },
  {
    path: "/verify-email",
    title: "Confirm your email",
    description: "Confirm the email address of your Car's Secrets account, or request a new confirmation email.",
    changeFrequency: "yearly",
    priority: 0.1,
    noindex: true,
  },
  {
    path: "/account",
    title: "Your account",
    description: "Your Car's Secrets account: who you are signed in as, and where to sign out.",
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
