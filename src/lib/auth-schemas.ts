/**
 * Validation for the auth forms, shared by the browser (React Hook Form) and the server
 * actions, so both give the same messages. Field names match the API's, so its field errors
 * land on the right input. The API validates again and has the final word.
 */

import { z } from "zod";
import { PHONE_FORMATS } from "@/lib/phone-formats";

export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;
export const NAME_MAX = 100;
export const EMAIL_MAX = 254;
export const CODE_LENGTH = 6;

/** Anything that is not a letter or a digit counts, spaces included. */
export const SPECIAL_CHARACTER = /[^\p{L}\p{N}]/u;

/** Whether a value is a complete address, for the places that act only on real ones. */
export function isEmailAddress(value: string): boolean {
  return z.email().safeParse(value.trim()).success;
}

/**
 * The ASCII digits of whatever was typed or pasted, at most six: "123 456", "123-456" and a
 * pasted "Your code: 123456" all become "123456".
 */
export function codeDigits(value: string): string {
  return value.replace(/[^0-9]/g, "").slice(0, CODE_LENGTH);
}

export function hasSpecialCharacter(value: string): boolean {
  return SPECIAL_CHARACTER.test(value);
}

/**
 * What a new password must contain. The checklist the form shows and the validation
 * that rejects it are the same list, so the two can never drift apart. The API applies
 * the same rules.
 */
export const PASSWORD_RULES = [
  {
    text: `At least ${PASSWORD_MIN} characters`,
    error: `Use at least ${PASSWORD_MIN} characters.`,
    test: (value: string) => value.length >= PASSWORD_MIN,
  },
  { text: "At least one letter", error: "Add at least one letter.", test: (value: string) => /\p{L}/u.test(value) },
  { text: "At least one number", error: "Add at least one number.", test: (value: string) => /\p{N}/u.test(value) },
  {
    text: "At least one special character",
    error: "Add at least one special character.",
    test: hasSpecialCharacter,
  },
] as const;

/**
 * Digits of a national number against the lengths its country allows, with or without the
 * trunk prefix people usually type ("06…" in France, "1…" in the US).
 */
export function isValidNationalNumber(countryCode: string, national: string): boolean {
  const digits = national.replace(/\D/g, "");
  const format = PHONE_FORMATS[countryCode.toUpperCase()];
  if (!format || format.lengths.length === 0) return digits.length >= 4;
  const withoutTrunk = format.trunk && digits.startsWith(format.trunk) ? digits.slice(format.trunk.length) : digits;
  return format.lengths.includes(digits.length) || format.lengths.includes(withoutTrunk.length);
}

const email = z
  .string()
  .trim()
  .min(1, { error: "Enter your email address." })
  .max(EMAIL_MAX, { error: `Use at most ${EMAIL_MAX} characters.` })
  .pipe(z.email({ error: "Enter a valid email address, like name@example.com." }));

const newPassword = z
  .string()
  .max(PASSWORD_MAX, { error: `Use at most ${PASSWORD_MAX} characters.` })
  .superRefine((value, ctx) => {
    for (const rule of PASSWORD_RULES) {
      if (!rule.test(value)) ctx.addIssue({ code: "custom", message: rule.error });
    }
  });

const name = (label: string) =>
  z
    .string()
    .trim()
    .min(1, { error: `Enter your ${label}.` })
    .max(NAME_MAX, { error: `Use at most ${NAME_MAX} characters.` });

const captchaToken = z.string().optional();

export const registerSchema = z
  .object({
    first_name: name("first name"),
    last_name: name("last name"),
    email,
    phone_country: z.string(),
    phone_number: z.string().trim(),
    password: newPassword,
    captcha_token: captchaToken,
  })
  .refine((data) => data.phone_number === "" || isValidNationalNumber(data.phone_country, data.phone_number), {
    path: ["phone_number"],
    error: "Enter a valid phone number for the country you picked.",
  });

export const loginSchema = z.object({
  email,
  password: z.string().min(1, { error: "Enter your password." }),
  remember: z.boolean(),
  captcha_token: captchaToken,
});

export const emailSchema = z.object({ email, captcha_token: captchaToken });

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: newPassword,
    password_confirm: z.string(),
  })
  .refine((data) => data.password === data.password_confirm, {
    path: ["password_confirm"],
    error: "The two passwords differ.",
  });

export const verifyEmailSchema = z.object({
  email,
  code: z.string().regex(/^[0-9]{6}$/, { error: `Enter the ${CODE_LENGTH}-digit code from the email.` }),
  remember: z.boolean(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type EmailInput = z.infer<typeof emailSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

/** First message per field, e.g. `{ email: "Enter a valid email address…" }`. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "");
    if (field && !errors[field]) errors[field] = issue.message;
  }
  return errors;
}
