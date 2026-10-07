import { redirect } from "next/navigation";
import { logoutAction } from "@/app/[lang]/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { localePath } from "@/lib/i18n";
import { getI18n } from "@/lib/i18n-server";
import { currentUser } from "@/lib/session";
import { metadataForRoute } from "@/lib/seo/metadata";

export const generateMetadata = () => metadataForRoute("/account");

export default async function AccountPage() {
  const [{ locale, m }, user] = await Promise.all([getI18n(), currentUser()]);
  if (!user) redirect(localePath("/login", locale));
  return (
    <main className="flex flex-1 justify-center px-4 py-8 sm:px-6 sm:py-16 lg:px-8">
      <div className="flex w-full max-w-md flex-col gap-6">
        <h1>{m.pages["/account"].title}</h1>
        <Card>
          <CardContent>
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
              <dt className="font-medium">{m.auth.email}</dt>
              <dd>{user.email}</dd>
              <dt className="font-medium">{m.auth.phone}</dt>
              <dd>{user.phone ?? m.auth.notProvided}</dd>
            </dl>
          </CardContent>
        </Card>
        <form action={logoutAction}>
          <Button type="submit" variant="outline" size="lg">
            {m.auth.signOut}
          </Button>
        </form>
      </div>
    </main>
  );
}
