"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { verifyEmailAction } from "@/app/(auth)/actions";
import { FormError } from "@/components/auth/FieldError";
import { showServerErrors } from "@/components/auth/form-helpers";
import type { TokenInput } from "@/lib/auth-schemas";

/** A button rather than confirming on page load, so mail scanners that open links cannot use the token. */
export function VerifyEmailForm({ token }: { token: string }) {
  const [done, setDone] = useState(false);
  const form = useForm<TokenInput>({ defaultValues: { token } });
  const { handleSubmit, formState } = form;

  const onSubmit = handleSubmit(async (values) => {
    const state = await verifyEmailAction(values);
    if (state?.ok) setDone(true);
    else showServerErrors(form, state);
  });

  if (done) {
    return (
      <div role="status" className="form-stack">
        <p className="notice">Your email address is confirmed.</p>
        <Link href="/login" className="btn btn-primary w-full">
          Sign in
        </Link>
      </div>
    );
  }
  return (
    <form onSubmit={onSubmit} className="form-stack">
      <FormError message={formState.errors.root?.server?.message}>
        {" "}
        <Link href="/verify-email">Request a new link</Link>
      </FormError>
      <button type="submit" disabled={formState.isSubmitting} className="btn btn-primary w-full">
        {formState.isSubmitting ? "Confirming…" : "Confirm my email"}
      </button>
    </form>
  );
}
