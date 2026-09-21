"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logoutAction } from "@/app/(auth)/actions";
import { forgetEmail } from "@/lib/remembered-email";
import type { SessionSummary } from "@/app/auth/session/route";

type User = SessionSummary["user"];

const GUEST_MENU = [
  { href: "/auctions", label: "Auctions" },
  { href: "/vin-lookup", label: "VIN Lookup" },
  { href: "/best-buys", label: "Best Buys" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/pricing", label: "Pricing" },
];

const MEMBER_MENU = [
  { href: "/auctions", label: "Auctions" },
  { href: "/vin-lookup", label: "VIN Lookup" },
  { href: "/best-buys", label: "Best Buys" },
  { href: "/saved", label: "Saved" },
  { href: "/alerts", label: "Alerts" },
];

function Menu({ items }: { items: typeof GUEST_MENU }) {
  return (
    <nav aria-label="Main" className="ml-6 hidden items-center gap-1 lg:flex">
      {items.map((item) => (
        <Link key={item.href} href={item.href} className="btn btn-ghost font-medium">
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

/**
 * The banner's menu and its right side: the pages a visitor or a signed-in
 * dealer can reach, then "Sign in / free trial" or the dealer's avatar and
 * "Sign out". It asks /auth/session after every navigation, so signing in or
 * out (both redirect) updates it.
 */
export function AccountNav() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | undefined>(undefined);

  useEffect(() => {
    let current = true;
    fetch("/auth/session", { cache: "no-store" })
      .then((response) => (response.ok ? (response.json() as Promise<SessionSummary>) : { user: null }))
      .then((summary) => current && setUser(summary.user))
      .catch(() => current && setUser(null));
    return () => {
      current = false;
    };
  }, [pathname]);

  if (user === undefined) {
    // Same height as the loaded state, so the banner does not jump.
    return <nav aria-label="Account" aria-busy="true" className="ml-auto h-11" />;
  }
  if (user === null) {
    return (
      <>
        <Menu items={GUEST_MENU} />
        <nav aria-label="Account" className="ml-auto flex items-center gap-2 sm:gap-3">
          <Link href="/login" className="btn btn-ghost font-medium">
            Sign in
          </Link>
          <Link href="/register" className="btn btn-primary flex-col gap-0 font-medium leading-tight">
            7 days free trial
            <span className="text-[0.6875rem] font-normal opacity-90">No credit cards required</span>
          </Link>
        </nav>
      </>
    );
  }
  const name = user.first_name || user.email;
  return (
    <>
      <Menu items={MEMBER_MENU} />
      <nav aria-label="Account" className="ml-auto flex items-center gap-2 sm:gap-3">
        <Link href="/account" className="btn btn-ghost font-medium" title={user.email}>
          <span aria-hidden="true" className="grid size-7 place-items-center rounded-full bg-brand-navy text-sm text-white">
            {name.charAt(0).toUpperCase()}
          </span>
          <span className="hidden sm:inline">{name}</span>
          <span className="sr-only sm:hidden">Your account ({name})</span>
        </Link>
        <form action={logoutAction} onSubmit={forgetEmail}>
          <button type="submit" className="btn btn-outline font-medium">
            Sign out
          </button>
        </form>
      </nav>
    </>
  );
}
