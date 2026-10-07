"use client";

import { createContext, type ReactNode, useContext } from "react";
import type { I18n } from "@/lib/i18n";
import { en } from "@/messages/en";

// English when nothing provides a language, as in a component's own test.
const I18nContext = createContext<I18n>({ locale: "en", m: en });

/** The page's language and its words, for the client components under the root layout. */
export function I18nProvider({ value, children }: { value: I18n; children: ReactNode }) {
  return <I18nContext value={value}>{children}</I18nContext>;
}

export const useI18n = () => useContext(I18nContext);
