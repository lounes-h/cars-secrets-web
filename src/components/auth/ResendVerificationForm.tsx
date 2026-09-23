"use client";

import { resendVerificationAction } from "@/app/(auth)/actions";
import { EmailRequestForm } from "@/components/auth/EmailRequestForm";
import { VerifyEmailForm } from "@/components/auth/VerifyEmailForm";

/**
 * Asks for the address, then for its code. The API sends a new code only when the last one is
 * over a minute old, so a code already in the inbox keeps working.
 */
export function ResendVerificationForm() {
  return (
    <EmailRequestForm
      action={resendVerificationAction}
      captchaAction="resend_verification"
      submitLabel="Email me a code"
      pendingLabel="Sending…"
      next={(email, retry) => <VerifyEmailForm email={email} onChangeEmail={retry} />}
    />
  );
}
