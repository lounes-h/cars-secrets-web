import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { Card, CardContent } from "@/components/ui/card";
import { metadataForRoute } from "@/lib/seo/metadata";

export const metadata = metadataForRoute("/forgot-password");

export default function ForgotPasswordPage() {
  return (
    <main className="flex flex-1 justify-center px-4 py-10 sm:px-6 sm:py-16 lg:px-10">
      <div className="flex w-full max-w-md flex-col gap-5">
        <h1>Forgot your password</h1>
        <Card>
          <CardContent>
            <ForgotPasswordForm />
          </CardContent>
        </Card>
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/login">Back to sign in</Link>
        </p>
      </div>
    </main>
  );
}
