"use client";

import { EarthIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { logoutAction } from "@/app/[lang]/(auth)/actions";
import type { SessionSummary } from "@/app/auth/session/route";
import { useI18n } from "@/components/I18nProvider";
import { LanguageButton, LanguageDialog } from "@/components/LanguageDialog";
import { Avatar as AvatarRoot, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { fill, formatCount, LOCALES, localePath, splitLocale } from "@/lib/i18n";
import { forgetEmail } from "@/lib/remembered-email";
import type { Messages } from "@/messages/en";

type User = SessionSummary["user"];
type Item = { href: string; label: keyof Messages["nav"] };

// Best Buys is left out of both menus for now; its page (/best-buys) still exists.
const GUEST_MENU: Item[] = [
  { href: "/active-lots", label: "activeLots" },
  { href: "/vin-lookup", label: "vinLookup" },
  { href: "/how-it-works", label: "howItWorks" },
  { href: "/pricing", label: "pricing" },
];

const MEMBER_MENU: Item[] = [
  { href: "/active-lots", label: "activeLots" },
  { href: "/vin-lookup", label: "vinLookup" },
  { href: "/saved", label: "saved" },
  { href: "/alerts", label: "alerts" },
];

// Sign-up and sign-in show the logo and the language alone, so nothing pulls the dealer off the form.
const LOGO_ONLY = new Set(["/register", "/login"]);

/** "Alerts", and how many are unread when any are: "Alerts 3", read out as "Alerts, 3 unread". */
function AlertsLabel({ unread }: { unread: number }) {
  const { locale, m } = useI18n();
  if (!unread) return m.nav.alerts;
  return (
    <>
      {m.nav.alerts}
      <Badge className="tabular-nums">{formatCount(locale, unread)}</Badge>
    </>
  );
}

/** What a screen reader calls a link to the alerts while some are unread. */
function alertsName(unread: number, { locale, m }: ReturnType<typeof useI18n>): string | undefined {
  return unread ? `${m.nav.alerts}, ${fill(m.nav.unread, { count: formatCount(locale, unread) })}` : undefined;
}

/**
 * The current page's item is marked: "page" on the page itself, "true" on a page under it (a
 * lot's page is in Active lots), and drawn as the ghost button's hover, kept on.
 */
function Menu({ items, path, unread = 0 }: { items: Item[]; path: string; unread?: number }) {
  const i18n = useI18n();
  const { locale, m } = i18n;
  return (
    <nav aria-label={m.nav.main} className="ml-6 hidden items-center gap-1 lg:flex">
      {items.map((item) => (
        <Link
          key={item.href}
          href={localePath(item.href, locale)}
          aria-current={path === item.href ? "page" : path.startsWith(`${item.href}/`) ? "true" : undefined}
          aria-label={item.label === "alerts" ? alertsName(unread, i18n) : undefined}
          className={buttonVariants({ variant: "ghost", className: "aria-[current]:bg-muted" })}
        >
          {item.label === "alerts" ? <AlertsLabel unread={unread} /> : m.nav[item.label]}
        </Link>
      ))}
    </nav>
  );
}

/**
 * The banner's menu and its right side: the pages a visitor or a signed-in
 * dealer can reach, then "Sign in / free trial" and the language, or the
 * dealer's initials, which open the account menu (the language is in it). It
 * asks /auth/session after every navigation, so signing in or out (both
 * redirect) updates it. On /register and /login it shows the language alone.
 */
export function AccountNav() {
  const pathname = usePathname();
  const { path } = splitLocale(pathname);
  const { locale, m } = useI18n();
  const [user, setUser] = useState<User | undefined>(undefined);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let current = true;
    fetch("/auth/session", { cache: "no-store" })
      .then((response) => (response.ok ? (response.json() as Promise<SessionSummary>) : { user: null, unread: 0 }))
      .then((summary) => {
        if (!current) return;
        setUser(summary.user);
        setUnread(summary.unread ?? 0);
      })
      .catch(() => current && setUser(null));
    return () => {
      current = false;
    };
  }, [pathname]);

  if (LOGO_ONLY.has(path)) {
    return (
      <div className="ml-auto">
        <LanguageButton />
      </div>
    );
  }
  if (user === undefined) {
    // Same height as the loaded state, so the banner does not jump.
    return <nav aria-label={m.nav.account} aria-busy="true" className="ml-auto h-10" />;
  }
  if (user === null) {
    return (
      <>
        <Menu items={GUEST_MENU} path={path} />
        <nav aria-label={m.nav.account} className="ml-auto flex items-center gap-2 sm:gap-3">
          <Link href={localePath("/login", locale)} className={buttonVariants({ variant: "ghost" })}>
            {m.nav.signIn}
          </Link>
          <Link href={localePath("/register", locale)} className={buttonVariants({ className: "flex-col gap-0 leading-tight" })}>
            {m.nav.trial}
            <span className="text-xs font-normal opacity-90">{m.nav.trialNote}</span>
          </Link>
          <LanguageButton />
        </nav>
      </>
    );
  }
  return (
    <>
      <Menu items={MEMBER_MENU} path={path} unread={unread} />
      <nav aria-label={m.nav.account} className="ml-auto flex items-center">
        <AccountMenu user={user} unread={unread} />
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
 * The round initials button and the menu it opens: who is signed in, Saved and Alerts where the
 * main menu is hidden (below lg), Settings, Account, Log out and, last, the language, which opens
 * the language dialog. A click outside, Escape or following one of its links closes it. Below lg
 * the initials carry the unread alerts' count too.
 */
function AccountMenu({ user, unread }: { user: NonNullable<User>; unread: number }) {
  const i18n = useI18n();
  const { locale, m } = i18n;
  const [choosing, setChoosing] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const name = `${user.first_name} ${user.last_name}`.trim();
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          ref={trigger}
          aria-label={unread ? fill(m.nav.accountMenuUnread, { count: formatCount(locale, unread) }) : m.nav.accountMenu}
          title={name || user.email}
          className="relative rounded-full"
        >
          <Avatar user={user} />
          {unread > 0 && <Badge className="absolute -top-1 -right-1 tabular-nums lg:hidden">{formatCount(locale, unread)}</Badge>}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          <div className="flex items-center gap-3 px-2 py-2">
            <Avatar user={user} />
            <div className="min-w-0">
              {name && <p className="truncate text-sm">{name}</p>}
              <p className="truncate text-xs text-muted-foreground" title={user.email}>
                {user.email}
              </p>
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem render={<Link href={localePath("/saved", locale)} />} className="lg:hidden">
            {m.nav.saved}
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href={localePath("/alerts", locale)} />} aria-label={alertsName(unread, i18n)} className="lg:hidden">
            <AlertsLabel unread={unread} />
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href={localePath("/settings", locale)} />}>{m.nav.settings}</DropdownMenuItem>
          <DropdownMenuItem render={<Link href={localePath("/account", locale)} />}>{m.nav.accountPage}</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              forgetEmail();
              void logoutAction();
            }}
          >
            {m.nav.logOut}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setChoosing(true)}>
            <EarthIcon aria-hidden="true" />
            {LOCALES[locale].label}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <LanguageDialog open={choosing} onOpenChange={setChoosing} returnFocus={trigger} />
    </>
  );
}
