"use client";

import { forgotPasswordAction } from "@/app/(auth)/actions";
import { EmailRequestForm } from "@/components/auth/EmailRequestForm";

export function ForgotPasswordForm() {
  return (
    <EmailRequestForm
      action={forgotPasswordAction}
      captchaAction="forgot_password"
      submitLabel="Send reset link"
      successMessage="If an account uses this address, we sent it a link to choose a new password. The link is valid for 1 hour."
    />
  );
}
