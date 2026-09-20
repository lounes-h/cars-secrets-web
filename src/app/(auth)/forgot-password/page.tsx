import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { metadataForRoute } from "@/lib/seo/metadata";

export const metadata = metadataForRoute("/forgot-password");

export default function ForgotPasswordPage() {
  return (
    <main className="flex justify-center px-4 py-10 sm:px-6 sm:py-16 lg:px-10">
      <div className="auth-panel">
        <h1>Forgot your password</h1>
        <p>Enter the email address of your account and we will send you a link to choose a new password.</p>
        <ForgotPasswordForm />
        <p className="hint text-center">
          <Link href="/login">Back to sign in</Link>
        </p>
      </div>
    </main>
  );
}
