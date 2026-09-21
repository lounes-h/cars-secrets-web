"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { registerAction } from "@/app/(auth)/actions";
import { FieldError, FormError } from "@/components/auth/FieldError";
import { showServerErrors, useRememberedEmail } from "@/components/auth/form-helpers";
import { PasswordField } from "@/components/auth/PasswordField";
import { PhoneField } from "@/components/auth/PhoneField";
import { Turnstile } from "@/components/auth/Turnstile";
import { EMAIL_MAX, NAME_MAX, registerSchema, type RegisterInput } from "@/lib/auth-schemas";
import { countryFromBrowser, type Country } from "@/lib/countries";

type Props = { countries: Country[]; defaultCountry: string };

export function RegisterForm({ countries, defaultCountry }: Props) {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = useState(0);
  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    // A field is checked once it has been visited, then on every submit.
    mode: "onTouched",
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone_country: defaultCountry,
      phone_number: "",
      password: "",
      accept_terms: false,
      captcha_token: "",
    },
  });
  const { register, handleSubmit, setValue, control, formState } = form;
  const { errors, isSubmitting } = formState;
  const password = useWatch({ control, name: "password" });
  const phoneCountry = useWatch({ control, name: "phone_country" });

  // The server guesses the country from Accept-Language; the browser knows better.
  useEffect(() => {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const detected = countryFromBrowser(zone, navigator.languages);
    if (detected) setValue("phone_country", detected);
  }, [setValue]);
  useRememberedEmail(form, { empty: "first_name", filled: "first_name" });

  const onSubmit = handleSubmit(async (values) => {
    const state = await registerAction(values);
    if (state?.ok) {
      setSentTo(values.email);
      return;
    }
    showServerErrors(form, state);
    setCaptchaReset((n) => n + 1);
  });

  if (sentTo) {
    return (
      <div role="status" className="form-stack">
        <p className="notice">
          We sent a confirmation link to <strong>{sentTo}</strong>. Open it to confirm your address, then sign in.
        </p>
        <Link href="/login" className="btn btn-primary w-full">
          Go to sign in
        </Link>
        <p className="hint text-center">
          No email after a few minutes? Check your spam folder or <Link href="/verify-email">send a new link</Link>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="form-stack">
      <FormError message={errors.root?.server?.message} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="first_name">First name</label>
          <input
            id="first_name"
            autoComplete="given-name"
            maxLength={NAME_MAX}
            aria-invalid={errors.first_name ? true : undefined}
            aria-describedby={errors.first_name ? "first_name-error" : undefined}
            {...register("first_name")}
          />
          <FieldError id="first_name-error" message={errors.first_name?.message} />
        </div>
        <div>
          <label htmlFor="last_name">Last name</label>
          <input
            id="last_name"
            autoComplete="family-name"
            maxLength={NAME_MAX}
            aria-invalid={errors.last_name ? true : undefined}
            aria-describedby={errors.last_name ? "last_name-error" : undefined}
            {...register("last_name")}
          />
          <FieldError id="last_name-error" message={errors.last_name?.message} />
        </div>
      </div>
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          maxLength={EMAIL_MAX}
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? "email-error" : undefined}
          {...register("email")}
        />
        <FieldError id="email-error" message={errors.email?.message} />
      </div>
      <PhoneField
        countries={countries}
        country={register("phone_country")}
        number={register("phone_number")}
        defaultCountry={defaultCountry}
        selected={phoneCountry}
        error={errors.phone_number?.message}
      />
      <PasswordField
        registration={register("password")}
        autoComplete="new-password"
        error={errors.password?.message}
        requirementFor={password}
      />
      <div>
        <div className="flex items-start gap-2">
          <input
            id="accept_terms"
            type="checkbox"
            className="mt-1"
            aria-invalid={errors.accept_terms ? true : undefined}
            aria-describedby={errors.accept_terms ? "accept_terms-error" : undefined}
            {...register("accept_terms")}
          />
          <label htmlFor="accept_terms" className="font-normal">
            I accept the Terms of Use and Privacy Policy
          </label>
        </div>
        <FieldError id="accept_terms-error" message={errors.accept_terms?.message} />
      </div>
      <Turnstile
        action="register"
        resetSignal={captchaReset}
        onToken={(token) => setValue("captcha_token", token ?? "")}
      />
      <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full">
        {isSubmitting ? "Creating your account…" : "Create account"}
      </button>
      <p className="hint text-center">
        Already registered? <Link href="/login">Sign in</Link>
      </p>
    </form>
  );
}
