import { ResendVerificationForm } from "@/components/auth/ResendVerificationForm";
import { VerifyEmailForm } from "@/components/auth/VerifyEmailForm";
import { metadataForRoute } from "@/lib/seo/metadata";

export const metadata = metadataForRoute("/verify-email");

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <main className="flex justify-center px-4 py-10 sm:px-6 sm:py-16 lg:px-10">
      <div className="auth-panel">
      <h1>Confirm your email</h1>
      {token ? (
        <>
          <p>Confirm this address to finish creating your account.</p>
          <div className="card">
            <VerifyEmailForm token={token} />
          </div>
        </>
      ) : (
        <>
          <p>
            Enter your email address and we will send a new confirmation link. Links are valid for 24 hours.
          </p>
          <div className="card">
            <ResendVerificationForm />
          </div>
        </>
      )}
      </div>
    </main>
  );
}
