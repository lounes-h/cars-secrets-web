import { ResendVerificationForm } from "@/components/auth/ResendVerificationForm";
import { metadataForRoute } from "@/lib/seo/metadata";

export const metadata = metadataForRoute("/verify-email");

export default function VerifyEmailPage() {
  return (
    <main className="auth-main flex justify-center px-4 py-10 sm:px-6 sm:py-16 lg:px-10">
      <div className="auth-panel">
        <h1>Confirm your email</h1>
        <div className="card">
          <ResendVerificationForm />
        </div>
      </div>
    </main>
  );
}
