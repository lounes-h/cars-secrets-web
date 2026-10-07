/** Every language's words, for the server; the browser gets only its page's, from I18nProvider. */

import type { Locale } from "@/lib/i18n";
import { en, type Messages } from "@/messages/en";
import { es } from "@/messages/es";

const MESSAGES: Record<Locale, Messages> = { en, es };

export const messagesFor = (locale: Locale): Messages => MESSAGES[locale];
