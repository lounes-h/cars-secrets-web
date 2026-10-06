import { ResendVerificationForm } from "@/components/auth/ResendVerificationForm";
import { Card, CardContent } from "@/components/ui/card";
import { metadataForRoute } from "@/lib/seo/metadata";

export const metadata = metadataForRoute("/verify-email");

export default function VerifyEmailPage() {
  return (
    <main className="flex flex-1 justify-center px-4 py-10 sm:px-6 sm:py-16 lg:px-10">
      <div className="flex w-full max-w-md flex-col gap-5">
        <h1>Confirm your email</h1>
        <Card>
          <CardContent>
            <ResendVerificationForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
