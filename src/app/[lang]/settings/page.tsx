import Link from "next/link";
import { AlertSettingsForm } from "@/components/AlertSettingsForm";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAlertSettings } from "@/lib/alerts";
import { localePath } from "@/lib/i18n";
import { getI18n } from "@/lib/i18n-server";
import { metadataForRoute } from "@/lib/seo/metadata";
import { currentUser, sessionToken, visitorIp, visitorZone } from "@/lib/session";

export const generateMetadata = () => metadataForRoute("/settings");

/**
 * Which alerts reach the dealer by email, how often the search summary comes, and the language and
 * zone of the emails. Until chosen, they start from the page's language and the browser's zone.
 */
export default async function SettingsPage() {
  const [{ locale, m }, user, token] = await Promise.all([getI18n(), currentUser(), sessionToken()]);
  const words = m.settings;
  if (!user || !token) {
    return (
      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <h1>{m.pages["/settings"].title}</h1>
        <p className="mt-8">
          <Link href={localePath("/login", locale)} className={buttonVariants()}>
            {words.signIn}
          </Link>
        </p>
      </main>
    );
  }
  const [settings, zone] = await Promise.all([getAlertSettings(token, await visitorIp()), visitorZone()]);
  const initial = { ...settings, time_zone: settings.time_zone ?? zone ?? "UTC", locale: settings.locale ?? locale };
  // Built here and passed down, so the browser lists the same zones the server rendered.
  const zones = Intl.supportedValuesOf("timeZone");
  return (
    <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <h1>{m.pages["/settings"].title}</h1>
      <p className="mt-2 max-w-[65ch] text-muted-foreground">{words.lede}</p>
      <Card className="mt-6 max-w-2xl">
        <CardHeader>
          <CardTitle>{words.email}</CardTitle>
        </CardHeader>
        <CardContent>
          <AlertSettingsForm initial={initial} zones={zones.includes(initial.time_zone) ? zones : [initial.time_zone, ...zones]} />
        </CardContent>
      </Card>
    </main>
  );
}
