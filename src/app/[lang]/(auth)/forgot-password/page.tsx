import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { Card, CardContent } from "@/components/ui/card";
import { localePath } from "@/lib/i18n";
import { getI18n } from "@/lib/i18n-server";
import { metadataForRoute } from "@/lib/seo/metadata";

export const generateMetadata = () => metadataForRoute("/forgot-password");

export default async function ForgotPasswordPage() {
  const { locale, m } = await getI18n();
  return (
    <main className="flex flex-1 justify-center px-4 py-8 sm:px-6 sm:py-16 lg:px-8">
      <div className="flex w-full max-w-md flex-col gap-6">
        <h1>{m.pages["/forgot-password"].title}</h1>
        <Card>
          <CardContent>
            <ForgotPasswordForm />
          </CardContent>
        </Card>
        <p className="text-center text-sm text-muted-foreground">
          <Link href={localePath("/login", locale)}>{m.auth.backToSignIn}</Link>
        </p>
      </div>
    </main>
  );
}
