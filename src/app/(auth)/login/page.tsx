import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { messageFor } from "@/components/auth/messages";
import { SocialButtons } from "@/components/auth/SocialButtons";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { FieldGroup, FieldSeparator } from "@/components/ui/field";
import { currentUser, rememberedChoice } from "@/lib/session";
import { metadataForRoute } from "@/lib/seo/metadata";

export const metadata = metadataForRoute("/login");

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await currentUser()) redirect("/account");
  const { error } = await searchParams;
  return (
    <main className="flex flex-1 justify-center px-4 py-10 sm:px-6 sm:py-16 lg:px-10">
      <div className="flex w-full max-w-md flex-col gap-5">
        <h1>Sign in</h1>
        {error && (
          <Alert variant="destructive">
            <AlertTitle className="font-semibold">{messageFor(error)}</AlertTitle>
          </Alert>
        )}
        <Card>
          <CardContent>
            <FieldGroup>
              <SocialButtons intent="Sign in" />
              <FieldSeparator>or sign in with your email</FieldSeparator>
              <LoginForm remember={await rememberedChoice()} />
            </FieldGroup>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
