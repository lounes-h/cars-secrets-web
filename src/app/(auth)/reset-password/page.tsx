import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { Card, CardContent } from "@/components/ui/card";
import { metadataForRoute } from "@/lib/seo/metadata";

export const metadata = metadataForRoute("/reset-password");

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <main className="flex flex-1 justify-center px-4 py-8 sm:px-6 sm:py-16 lg:px-8">
      <div className="flex w-full max-w-md flex-col gap-6">
        <h1>Choose a new password</h1>
        {token ? (
          <Card>
            <CardContent>
              <ResetPasswordForm token={token} />
            </CardContent>
          </Card>
        ) : (
          <p className="text-muted-foreground">
            This link is incomplete. <Link href="/forgot-password">Request a new reset link</Link>.
          </p>
        )}
      </div>
    </main>
  );
}
