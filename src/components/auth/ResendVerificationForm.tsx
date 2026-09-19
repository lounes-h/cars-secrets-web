"use client";

import { resendVerificationAction } from "@/app/(auth)/actions";
import { EmailRequestForm } from "@/components/auth/EmailRequestForm";

export function ResendVerificationForm() {
  return (
    <EmailRequestForm
      action={resendVerificationAction}
      captchaAction="resend_verification"
      submitLabel="Send a new confirmation link"
      pendingLabel="Sending…"
      success={(email) => (
        <>
          If <strong>{email}</strong> has an unconfirmed account, we sent it a new confirmation link. It expires in 24
          hours.
        </>
      )}
    />
  );
}
