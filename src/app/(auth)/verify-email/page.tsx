import { ResendVerificationForm } from "@/components/auth/ResendVerificationForm";
import { VerifyEmailForm } from "@/components/auth/VerifyEmailForm";
import { metadataForRoute } from "@/lib/seo/metadata";

export const metadata = metadataForRoute("/verify-email");

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <main className="auth-main flex justify-center px-4 py-10 sm:px-6 sm:py-16 lg:px-10">
      <div className="auth-panel">
      <h1>Confirm your email</h1>
      <div className="card">{token ? <VerifyEmailForm token={token} /> : <ResendVerificationForm />}</div>
      </div>
    </main>
  );
}
