"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logoutAction } from "@/app/(auth)/actions";
import { forgetEmail } from "@/lib/remembered-email";
import type { SessionSummary } from "@/app/auth/session/route";

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
 * dealer can reach, then "Sign in / free trial" or the dealer's initials,
 * which open the account menu. It asks /auth/session after every navigation,
 * so signing in or out (both redirect) updates it.
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
  return (
    <>
      <Menu items={MEMBER_MENU} />
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
    <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full bg-line text-sm font-semibold text-ink">
      {initials(user)}
    </span>
  );
}

/**
 * The round initials button and the menu it opens: who is signed in, Settings,
 * Account and Log out. A native popover, so a click outside or Escape closes it.
 */
function AccountMenu({ user }: { user: NonNullable<User> }) {
  const name = `${user.first_name} ${user.last_name}`.trim();
  return (
    <>
      <button type="button" popoverTarget="account-menu" aria-label="Account menu" title={name || user.email} className="account-avatar rounded-full">
        <Avatar user={user} />
      </button>
      <div
        id="account-menu"
        popover="auto"
        className="account-menu"
        // A link moves within the app and the banner stays, so close the menu behind it.
        onClick={(event) => (event.target as Element).closest("a") && event.currentTarget.hidePopover()}
      >
        <div className="flex items-center gap-3 px-5 py-4">
          <Avatar user={user} />
          <div className="min-w-0">
            {name && <p className="m-0 truncate text-[1.0625rem]">{name}</p>}
            <p className="m-0 truncate text-sm text-muted" title={user.email}>
              {user.email}
            </p>
          </div>
        </div>
        <div className="py-2">
          <Link href="/settings" className="account-menu-item">
            Settings
          </Link>
          <Link href="/account" className="account-menu-item">
            Account
          </Link>
        </div>
        <form action={logoutAction} onSubmit={forgetEmail} className="py-2">
          <button type="submit" className="account-menu-item">
            Log out
          </button>
        </form>
      </div>
    </>
  );
}
