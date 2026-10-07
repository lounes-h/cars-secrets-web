"use client";

import { forgotPasswordAction } from "@/app/[lang]/(auth)/actions";
import { EmailRequestForm } from "@/components/auth/EmailRequestForm";
import { useI18n } from "@/components/I18nProvider";
import { rich } from "@/lib/i18n";

export function ForgotPasswordForm() {
  const { m } = useI18n();
  return (
    <EmailRequestForm
      action={forgotPasswordAction}
      captchaAction="forgot_password"
      submitLabel={m.auth.forgot.submit}
      pendingLabel={m.auth.sending}
      success={(email) => rich(m.auth.forgot.sent, { email: <strong>{email}</strong> })}
    />
  );
}
