import { ResendVerificationForm } from "@/components/auth/ResendVerificationForm";
import { VerifyEmailForm } from "@/components/auth/VerifyEmailForm";
import { metadataForRoute } from "@/lib/seo/metadata";

export const metadata = metadataForRoute("/verify-email");

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <main className="px-4 py-8 sm:px-6 lg:px-10">
      <h1>Confirm your email</h1>
      {token ? (
        <>
          <p className="max-w-[65ch]">Confirm this address to finish creating your account.</p>
          <VerifyEmailForm token={token} />
        </>
      ) : (
        <>
          <p className="max-w-[65ch]">
            Enter your email address and we will send a new confirmation link. Links are valid for 24 hours.
          </p>
          <ResendVerificationForm />
        </>
      )}
    </main>
  );
}
