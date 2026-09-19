"use client";

import { forgotPasswordAction } from "@/app/(auth)/actions";
import { EmailRequestForm } from "@/components/auth/EmailRequestForm";

export function ForgotPasswordForm() {
  return (
    <EmailRequestForm
      action={forgotPasswordAction}
      captchaAction="forgot_password"
      submitLabel="Send reset link"
      pendingLabel="Sending…"
      success={(email) => (
        <>
          If an account uses <strong>{email}</strong>, we sent it a link to choose a new password. The link works
          once and expires in 1 hour.
        </>
      )}
    />
  );
}
