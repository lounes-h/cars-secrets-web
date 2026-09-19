"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logoutAction } from "@/app/(auth)/actions";
import type { SessionSummary } from "@/app/auth/session/route";

type User = SessionSummary["user"];

/**
 * The banner's right side: "Sign in / Register", or the signed-in dealer's name and "Sign out".
 * It asks /auth/session after every navigation, so signing in or out (both redirect) updates it.
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
      <nav aria-label="Account" className="ml-auto flex items-center gap-2 sm:gap-3">
        <Link href="/login" className="btn btn-ghost">
          Sign in
        </Link>
        <Link href="/register" className="btn btn-primary">
          Register
        </Link>
      </nav>
    );
  }
  const name = user.first_name || user.email;
  return (
    <nav aria-label="Account" className="ml-auto flex items-center gap-2 sm:gap-3">
      <Link href="/account" className="btn btn-ghost" title={user.email}>
        <span aria-hidden="true" className="grid size-7 place-items-center rounded-full bg-brand-red text-sm text-white">
          {name.charAt(0).toUpperCase()}
        </span>
        <span className="hidden sm:inline">{name}</span>
        <span className="sr-only sm:hidden">Your account ({name})</span>
      </Link>
      <form action={logoutAction}>
        <button type="submit" className="btn btn-outline">
          Sign out
        </button>
      </form>
    </nav>
  );
}
