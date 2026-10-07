import { ResendVerificationForm } from "@/components/auth/ResendVerificationForm";
import { Card, CardContent } from "@/components/ui/card";
import { getI18n } from "@/lib/i18n-server";
import { metadataForRoute } from "@/lib/seo/metadata";

export const generateMetadata = () => metadataForRoute("/verify-email");

export default async function VerifyEmailPage() {
  const { m } = await getI18n();
  return (
    <main className="flex flex-1 justify-center px-4 py-8 sm:px-6 sm:py-16 lg:px-8">
      <div className="flex w-full max-w-md flex-col gap-6">
        <h1>{m.pages["/verify-email"].title}</h1>
        <Card>
          <CardContent>
            <ResendVerificationForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
