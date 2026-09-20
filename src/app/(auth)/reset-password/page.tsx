import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { metadataForRoute } from "@/lib/seo/metadata";

export const metadata = metadataForRoute("/reset-password");

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <main className="flex justify-center px-4 py-10 sm:px-6 sm:py-16 lg:px-10">
      <div className="auth-panel">
        <h1>Choose a new password</h1>
        {token ? (
          <>
            <p>Your new password must be at least 10 characters long.</p>
            <ResetPasswordForm token={token} />
          </>
        ) : (
          <p>
            This link is incomplete. <Link href="/forgot-password">Request a new reset link</Link>.
          </p>
        )}
      </div>
    </main>
  );
}
