"use client";

import Link from "next/link";
import { useActionState } from "react";
import { resetPasswordAction } from "@/app/(auth)/actions";
import { PasswordField } from "@/components/auth/PasswordField";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPasswordAction, undefined);
  if (state?.ok) {
    return (
      <p role="status" className="notice">
        Your password has changed and every other session was signed out. <Link href="/login">Sign in</Link> with
        your new password.
      </p>
    );
  }
  return (
    <form action={action} className="form-stack">
      {state?.message && <p role="alert">{state.message}</p>}
      {state?.code === "invalid_token" && (
        <p>
          <Link href="/forgot-password">Request a new link</Link>
        </p>
      )}
      <input type="hidden" name="token" value={token} />
      <PasswordField label="New password" autoComplete="new-password" minLength={10} error={state?.errors?.password} />
      <PasswordField
        name="password_confirm"
        label="Confirm new password"
        autoComplete="new-password"
        minLength={10}
        error={state?.errors?.password_confirm}
      />
      <button type="submit" disabled={pending} className="btn btn-primary w-full">
        Change password
      </button>
    </form>
  );
}
