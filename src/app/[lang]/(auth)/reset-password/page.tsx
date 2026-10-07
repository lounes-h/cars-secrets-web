import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { Card, CardContent } from "@/components/ui/card";
import { localePath, rich } from "@/lib/i18n";
import { getI18n } from "@/lib/i18n-server";
import { metadataForRoute } from "@/lib/seo/metadata";

export const generateMetadata = () => metadataForRoute("/reset-password");

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const [{ locale, m }, { token }] = await Promise.all([getI18n(), searchParams]);
  return (
    <main className="flex flex-1 justify-center px-4 py-8 sm:px-6 sm:py-16 lg:px-8">
      <div className="flex w-full max-w-md flex-col gap-6">
        <h1>{m.pages["/reset-password"].title}</h1>
        {token ? (
          <Card>
            <CardContent>
              <ResetPasswordForm token={token} />
            </CardContent>
          </Card>
        ) : (
          <p className="text-muted-foreground">
            {rich(m.auth.incompleteLink, {
              link: <Link href={localePath("/forgot-password", locale)}>{m.auth.requestNewResetLink}</Link>,
            })}
          </p>
        )}
      </div>
    </main>
  );
}
