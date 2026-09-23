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
import { SocialButtons } from "@/components/auth/SocialButtons";
import { Turnstile } from "@/components/auth/Turnstile";
import { EMAIL_MAX, NAME_MAX, registerSchema, type RegisterInput } from "@/lib/auth-schemas";
import { VerifyEmailForm } from "@/components/auth/VerifyEmailForm";
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
  useRememberedEmail(form, "first_name");

  const onSubmit = handleSubmit(async (values) => {
    const state = await registerAction(values);
    if (state?.ok) {
      // The address stays remembered: /verify-email needs it until the code is entered.
      setSentTo(values.email);
      return;
    }
    showServerErrors(form, state);
    setCaptchaReset((n) => n + 1);
  });

  // The form's values survive the detour, so correcting the address is not a new form.
  if (sentTo) return <VerifyEmailForm email={sentTo} onChangeEmail={() => setSentTo(null)} />;

  // The social buttons sit here, not on the page, so the code step replaces them too.
  return (
    <>
      <SocialButtons intent="Register" />
      <p className="divider">or register with your email</p>
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
        <Turnstile
          action="register"
          resetSignal={captchaReset}
          onToken={(token) => setValue("captcha_token", token ?? "")}
        />
        <p className="hint">
          By clicking on &ldquo;Agree and register&rdquo;, I agree to the Terms of Use and Privacy
          Policy.
        </p>
        <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full">
          {isSubmitting ? "Creating your account…" : "Agree and register"}
        </button>
        <p className="hint text-center">
          Already registered? <Link href="/login">Sign in</Link>
        </p>
      </form>
    </>
  );
}
