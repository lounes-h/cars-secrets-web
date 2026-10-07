"use client";

import { resendVerificationAction } from "@/app/[lang]/(auth)/actions";
import { EmailRequestForm } from "@/components/auth/EmailRequestForm";
import { VerifyEmailForm } from "@/components/auth/VerifyEmailForm";
import { useI18n } from "@/components/I18nProvider";

/**
 * Asks for the address, then for its code. The API sends a new code only when the last one is
 * over a minute old, so a code already in the inbox keeps working.
 */
export function ResendVerificationForm() {
  const { m } = useI18n();
  return (
    <EmailRequestForm
      action={resendVerificationAction}
      captchaAction="resend_verification"
      submitLabel={m.auth.resend.submit}
      pendingLabel={m.auth.sending}
      next={(email, retry) => <VerifyEmailForm email={email} onChangeEmail={retry} />}
    />
  );
}
