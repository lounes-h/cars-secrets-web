import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { SocialButtons } from "@/components/auth/SocialButtons";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { FieldGroup, FieldSeparator } from "@/components/ui/field";
import { localePath, lookup } from "@/lib/i18n";
import { getI18n } from "@/lib/i18n-server";
import { currentUser, rememberedChoice } from "@/lib/session";
import { metadataForRoute } from "@/lib/seo/metadata";

export const generateMetadata = () => metadataForRoute("/login");

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { locale, m } = await getI18n();
  if (await currentUser()) redirect(localePath("/account", locale));
  const { error } = await searchParams;
  return (
    <main className="flex flex-1 justify-center px-4 py-8 sm:px-6 sm:py-16 lg:px-8">
      <div className="flex w-full max-w-md flex-col gap-6">
        <h1>{m.pages["/login"].title}</h1>
        {error && (
          <Alert variant="destructive">
            <AlertTitle className="font-semibold">{lookup(m.auth.oauthErrors, error) ?? m.auth.somethingWrong}</AlertTitle>
          </Alert>
        )}
        <Card>
          <CardContent>
            <FieldGroup>
              <SocialButtons intent="login" />
              <FieldSeparator>{m.auth.loginSeparator}</FieldSeparator>
              <LoginForm remember={await rememberedChoice()} />
            </FieldGroup>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
