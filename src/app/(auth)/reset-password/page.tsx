import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { metadataForRoute } from "@/lib/seo/metadata";

export const metadata = metadataForRoute("/reset-password");

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <main className="px-4 py-8 sm:px-6 lg:px-10">
      <h1>Choose a new password</h1>
      {token ? (
        <>
          <p className="max-w-[65ch]">Your new password must be at least 10 characters long.</p>
          <ResetPasswordForm token={token} />
        </>
      ) : (
        <p className="max-w-[65ch]">
          This link is incomplete. <Link href="/forgot-password">Request a new reset link</Link>.
        </p>
      )}
    </main>
  );
}
