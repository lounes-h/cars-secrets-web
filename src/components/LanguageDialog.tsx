"use client";

import { CheckIcon, EarthIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import type { RefObject } from "react";
import { useI18n } from "@/components/I18nProvider";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { fill, LOCALE_LIST, LOCALES, splitLocale } from "@/lib/i18n";

/**
 * "Choose a language:" and each language, named in itself, as a link to this page in it. The
 * link carries its prefix, English's too ("/en/…"): the proxy remembers the choice and drops
 * English's prefix. A plain link, so the whole page reloads in the new language.
 */
function Languages() {
  const { locale, m } = useI18n();
  const { path } = splitLocale(usePathname());
  // Only rendered once the dialog opens, in the browser: the lot list's filters come along.
  const search = window.location.search;
  return (
    <>
      <DialogTitle>{m.language.title}</DialogTitle>
      <ul className="flex flex-col gap-1">
        {LOCALE_LIST.map((lang) => (
          <li key={lang}>
            <a
              href={`/${lang}${path === "/" ? "" : path}${search}`}
              hrefLang={LOCALES[lang].tag}
              lang={LOCALES[lang].tag}
              aria-current={lang === locale ? "true" : undefined}
              className={buttonVariants({ variant: "ghost", size: "lg", className: "w-full justify-between aria-[current]:bg-muted" })}
            >
              {LOCALES[lang].label}
              {lang === locale && <CheckIcon aria-hidden="true" />}
            </a>
          </li>
        ))}
      </ul>
    </>
  );
}

/** The banner's earth button for visitors, which opens the dialog. */
export function LanguageButton() {
  const { locale, m } = useI18n();
  return (
    <Dialog>
      <DialogTrigger
        render={<Button variant="ghost" aria-label={fill(m.language.button, { language: LOCALES[locale].label })} />}
      >
        <EarthIcon aria-hidden="true" />
        <span className="hidden sm:inline">{LOCALES[locale].short}</span>
      </DialogTrigger>
      <DialogContent>
        <Languages />
      </DialogContent>
    </Dialog>
  );
}

/** The same dialog opened from elsewhere (the account menu); focus goes back to `returnFocus`. */
export function LanguageDialog({
  open,
  onOpenChange,
  returnFocus,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  returnFocus?: RefObject<HTMLElement | null>;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent finalFocus={returnFocus}>
        <Languages />
      </DialogContent>
    </Dialog>
  );
}
