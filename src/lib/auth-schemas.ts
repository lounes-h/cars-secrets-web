/**
 * Validation for the auth forms, shared by the browser (React Hook Form) and the server
 * actions, so both give the same messages, in the page's language. Field names match the
 * API's, so its field errors land on the right input. The API validates again and has the
 * final word.
 */

import { z } from "zod";
import { fill } from "@/lib/i18n";
import { PHONE_FORMATS } from "@/lib/phone-formats";
import type { Messages } from "@/messages/en";

type Words = Messages["auth"];

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
 * that rejects it are the same list, so the two can never drift apart; each rule's words are
 * `passwordRules[key]` in the messages. The API applies the same rules.
 */
export const PASSWORD_RULES = [
  { key: "length", test: (value: string) => value.length >= PASSWORD_MIN },
  { key: "letter", test: (value: string) => /\p{L}/u.test(value) },
  { key: "number", test: (value: string) => /\p{N}/u.test(value) },
  { key: "special", test: hasSpecialCharacter },
] as const;

/** A rule's checklist line and the error it gives, in the page's language. */
export function ruleWords(words: Words, key: (typeof PASSWORD_RULES)[number]["key"]): { text: string; error: string } {
  const { text, error } = words.passwordRules[key];
  return { text: fill(text, { min: PASSWORD_MIN }), error: fill(error, { min: PASSWORD_MIN }) };
}

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

const cache = new WeakMap<Words, ReturnType<typeof buildSchemas>>();

/** The auth forms' schemas, their messages in the language of `words` (built once per language). */
export function authSchemas(words: Words): ReturnType<typeof buildSchemas> {
  let schemas = cache.get(words);
  if (!schemas) cache.set(words, (schemas = buildSchemas(words)));
  return schemas;
}

function buildSchemas(words: Words) {
  const v = words.validation;
  const tooLong = (max: number) => ({ error: fill(v.tooLong, { max }) });

  const email = z
    .string()
    .trim()
    .min(1, { error: v.emailRequired })
    .max(EMAIL_MAX, tooLong(EMAIL_MAX))
    .pipe(z.email({ error: v.emailInvalid }));

  const newPassword = z
    .string()
    .max(PASSWORD_MAX, tooLong(PASSWORD_MAX))
    .superRefine((value, ctx) => {
      for (const rule of PASSWORD_RULES) {
        if (!rule.test(value)) ctx.addIssue({ code: "custom", message: ruleWords(words, rule.key).error });
      }
    });

  const name = (required: string) => z.string().trim().min(1, { error: required }).max(NAME_MAX, tooLong(NAME_MAX));

  const captchaToken = z.string().optional();

  return {
    registerSchema: z
      .object({
        first_name: name(v.firstNameRequired),
        last_name: name(v.lastNameRequired),
        email,
        phone_country: z.string(),
        phone_number: z.string().trim(),
        password: newPassword,
        captcha_token: captchaToken,
      })
      .refine((data) => data.phone_number === "" || isValidNationalNumber(data.phone_country, data.phone_number), {
        path: ["phone_number"],
        error: v.phoneInvalid,
      }),

    loginSchema: z.object({
      email,
      password: z.string().min(1, { error: v.passwordRequired }),
      remember: z.boolean(),
      captcha_token: captchaToken,
    }),

    emailSchema: z.object({ email, captcha_token: captchaToken }),

    resetPasswordSchema: z
      .object({
        token: z.string().min(1),
        password: newPassword,
        password_confirm: z.string(),
      })
      .refine((data) => data.password === data.password_confirm, {
        path: ["password_confirm"],
        error: v.passwordsDiffer,
      }),

    verifyEmailSchema: z.object({
      email,
      code: z.string().regex(/^[0-9]{6}$/, { error: fill(v.code, { length: CODE_LENGTH }) }),
      remember: z.boolean(),
    }),
  };
}

type Schemas = ReturnType<typeof buildSchemas>;
export type RegisterInput = z.infer<Schemas["registerSchema"]>;
export type LoginInput = z.infer<Schemas["loginSchema"]>;
export type EmailInput = z.infer<Schemas["emailSchema"]>;
export type ResetPasswordInput = z.infer<Schemas["resetPasswordSchema"]>;
export type VerifyEmailInput = z.infer<Schemas["verifyEmailSchema"]>;

/** First message per field, e.g. `{ email: "Enter a valid email address…" }`. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "");
    if (field && !errors[field]) errors[field] = issue.message;
  }
  return errors;
}
