"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logoutAction } from "@/app/(auth)/actions";
import type { SessionSummary } from "@/app/auth/session/route";
import { Avatar as AvatarRoot, AvatarFallback } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { forgetEmail } from "@/lib/remembered-email";

type User = SessionSummary["user"];

// Best Buys is left out of both menus for now; its page (/best-buys) still exists.
const GUEST_MENU = [
  { href: "/active-lots", label: "Active lots" },
  { href: "/vin-lookup", label: "VIN Lookup" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/pricing", label: "Pricing" },
];

const MEMBER_MENU = [
  { href: "/active-lots", label: "Active lots" },
  { href: "/vin-lookup", label: "VIN Lookup" },
  { href: "/saved", label: "Saved" },
  { href: "/alerts", label: "Alerts" },
];

// Sign-up and sign-in show the logo alone, so nothing pulls the dealer off the form.
const LOGO_ONLY = new Set(["/register", "/login"]);

/**
 * The current page's item is marked: "page" on the page itself, "true" on a page under it (a
 * lot's page is in Active lots), and drawn as the ghost button's hover, kept on.
 */
function Menu({ items, pathname }: { items: typeof GUEST_MENU; pathname: string }) {
  return (
    <nav aria-label="Main" className="ml-6 hidden items-center gap-1 lg:flex">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={pathname === item.href ? "page" : pathname.startsWith(`${item.href}/`) ? "true" : undefined}
          className={buttonVariants({ variant: "ghost", className: "aria-[current]:bg-muted" })}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

/**
 * The banner's menu and its right side: the pages a visitor or a signed-in
 * dealer can reach, then "Sign in / free trial" or the dealer's initials,
 * which open the account menu. It asks /auth/session after every navigation,
 * so signing in or out (both redirect) updates it. On /register and /login it
 * renders nothing, leaving the logo alone.
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

  if (LOGO_ONLY.has(pathname)) return null;
  if (user === undefined) {
    // Same height as the loaded state, so the banner does not jump.
    return <nav aria-label="Account" aria-busy="true" className="ml-auto h-11" />;
  }
  if (user === null) {
    return (
      <>
        <Menu items={GUEST_MENU} pathname={pathname} />
        <nav aria-label="Account" className="ml-auto flex items-center gap-2 sm:gap-3">
          <Link href="/login" className={buttonVariants({ variant: "ghost" })}>
            Sign in
          </Link>
          <Link href="/register" className={buttonVariants({ className: "h-auto flex-col gap-0 py-1 leading-tight" })}>
            7 days free trial
            <span className="text-[0.6875rem] font-normal opacity-90">No credit cards required</span>
          </Link>
        </nav>
      </>
    );
  }
  return (
    <>
      <Menu items={MEMBER_MENU} pathname={pathname} />
      <nav aria-label="Account" className="ml-auto flex items-center">
        <AccountMenu user={user} />
      </nav>
    </>
  );
}

/** "LH" from the dealer's names, or the email's first letter when they gave none. */
export function initials(user: NonNullable<User>): string {
  const letters = `${user.first_name.charAt(0)}${user.last_name.charAt(0)}` || user.email.charAt(0);
  return letters.toUpperCase();
}

function Avatar({ user }: { user: NonNullable<User> }) {
  return (
    <AvatarRoot aria-hidden="true" size="lg">
      <AvatarFallback className="font-semibold text-foreground">{initials(user)}</AvatarFallback>
    </AvatarRoot>
  );
}

/**
 * The round initials button and the menu it opens: who is signed in, Settings, Account and
 * Log out. A click outside, Escape or following one of its links closes it.
 */
function AccountMenu({ user }: { user: NonNullable<User> }) {
  const name = `${user.first_name} ${user.last_name}`.trim();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label="Account menu" title={name || user.email} className="rounded-full">
        <Avatar user={user} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <div className="flex items-center gap-3 px-1.5 py-2">
          <Avatar user={user} />
          <div className="min-w-0">
            {name && <p className="truncate text-sm">{name}</p>}
            <p className="truncate text-xs text-muted-foreground" title={user.email}>
              {user.email}
            </p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/settings" />}>Settings</DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/account" />}>Account</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            forgetEmail();
            void logoutAction();
          }}
        >
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
