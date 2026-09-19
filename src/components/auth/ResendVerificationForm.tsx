"use client";

import { resendVerificationAction } from "@/app/(auth)/actions";
import { EmailRequestForm } from "@/components/auth/EmailRequestForm";

export function ResendVerificationForm() {
  return (
    <EmailRequestForm
      action={resendVerificationAction}
      captchaAction="resend_verification"
      submitLabel="Send a new confirmation link"
      successMessage="If this address has an unconfirmed account, we sent it a new confirmation link."
    />
  );
}
