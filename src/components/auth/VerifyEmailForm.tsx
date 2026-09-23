"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { resendVerificationAction, verifyEmailAction } from "@/app/(auth)/actions";
import { FieldError, FormError } from "@/components/auth/FieldError";
import { showServerErrors } from "@/components/auth/form-helpers";
import { Turnstile } from "@/components/auth/Turnstile";
import { CODE_LENGTH, codeDigits, verifyEmailSchema, type VerifyEmailInput } from "@/lib/auth-schemas";
import { forgetEmail, rememberEmail } from "@/lib/remembered-email";

/** The API sends at most one code a minute; the button waits as long. */
export const RESEND_SECONDS = 60;

type Props = {
  /** Where the code went. Held by the page, never put in the URL. */
  email: string;
  /** Carried over when the code step interrupts a sign in with "remember me". */
  remember?: boolean;
  /** Back to the step where the address was typed, to correct it. */
  onChangeEmail?: () => void;
};

/**
 * The six-digit code mailed to confirm an address. One field rather than six boxes: it takes a
 * paste in any shape, the phone's one-time-code autofill and a screen reader alike. A right code
 * signs the dealer in (the action redirects to /account).
 */
export function VerifyEmailForm({ email, remember = false, onChangeEmail }: Props) {
  // A deadline rather than a count of ticks: browsers slow timers down in a background tab,
  // which is where this one sits while the dealer reads their mail.
  const [now, setNow] = useState(() => Date.now());
  const [until, setUntil] = useState(() => Date.now() + RESEND_SECONDS * 1000);
  const wait = Math.max(0, Math.ceil((until - now) / 1000));
  const [resent, setResent] = useState(false);
  const [resending, setResending] = useState(false);
  const [captcha, setCaptcha] = useState("");
  const [captchaReset, setCaptchaReset] = useState(0);
  const form = useForm<VerifyEmailInput>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: { email, code: "", remember },
  });
  const { register, handleSubmit, setValue, setFocus, setError, formState } = form;
  const { errors, isSubmitting } = formState;

  useEffect(() => setFocus("code"), [setFocus]);
  useEffect(() => {
    if (now >= until) return;
    const timer = setTimeout(() => setNow(Date.now()), 1000);
    return () => clearTimeout(timer);
  }, [now, until]);

  const onSubmit = handleSubmit(async (values) => {
    // Signed in from here on, so the tab stops offering the address. Only reached again on failure.
    forgetEmail();
    const state = await verifyEmailAction(values);
    if (!state) return;
    rememberEmail(email);
    if (state.code === "invalid_code") {
      setValue("code", "");
      setError("code", { type: "server", message: state.message }, { shouldFocus: true });
      return;
    }
    showServerErrors(form, state);
  });

  const code = register("code", {
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
      const digits = codeDigits(event.target.value);
      setValue("code", digits);
      // Typed, pasted or autofilled: six digits are the whole answer, so send them.
      // While a code is being checked the button is disabled, which also stops Enter.
      if (digits.length === CODE_LENGTH && !isSubmitting) void onSubmit();
    },
  });

  async function resend() {
    setResending(true);
    setResent(false);
    const state = await resendVerificationAction({ email, captcha_token: captcha });
    setResending(false);
    setCaptchaReset((n) => n + 1);
    if (!state?.ok) {
      showServerErrors(form, state);
      return;
    }
    form.clearErrors();
    setValue("code", "");
    setFocus("code");
    setResent(true);
    const sentAt = Date.now();
    setNow(sentAt);
    setUntil(sentAt + RESEND_SECONDS * 1000);
  }

  return (
    <form onSubmit={onSubmit} noValidate className="form-stack">
      <p>
        Enter the {CODE_LENGTH}-digit code we sent to <strong>{email}</strong>. It expires in 10 minutes.
      </p>
      <FormError message={errors.root?.server?.message} />
      <div>
        <label htmlFor="code">Confirmation code</label>
        <input
          id="code"
          type="text"
          className="code-input"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          // No maxLength: it would cut a pasted "123 456" before the spaces are dropped.
          spellCheck={false}
          aria-invalid={errors.code ? true : undefined}
          aria-describedby={errors.code ? "code-error" : "code-hint"}
          {...code}
        />
        <FieldError id="code-error" message={errors.code?.message} />
        {!errors.code && (
          <p id="code-hint" className="hint mt-1">
            Can&rsquo;t find it? Check your spam or promotions folder.
          </p>
        )}
      </div>
      <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full">
        {isSubmitting ? "Confirming…" : "Confirm my email"}
      </button>
      <div role="status" aria-live="polite">
        {resent && <p className="notice">We sent a new code to {email}. Use the newest one.</p>}
      </div>
      {wait <= 0 && (
        <Turnstile action="resend_verification" resetSignal={captchaReset} onToken={(token) => setCaptcha(token ?? "")} />
      )}
      <p className="hint text-center">
        {wait > 0 ? (
          <>Didn&rsquo;t get it? You can ask for a new code in {wait} s.</>
        ) : (
          <button type="button" className="btn btn-link inline p-0 underline" disabled={resending} onClick={resend}>
            {resending ? "Sending…" : "Send a new code"}
          </button>
        )}
        {onChangeEmail && (
          <>
            {" · "}
            <button type="button" className="btn btn-link inline p-0 underline" onClick={onChangeEmail}>
              Use a different email
            </button>
          </>
        )}
      </p>
    </form>
  );
}
