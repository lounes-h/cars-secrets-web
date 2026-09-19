/**
 * Validation for the auth forms, shared by the browser (React Hook Form) and the server
 * actions, so both give the same messages. Field names match the API's, so its field errors
 * land on the right input. The API validates again and has the final word.
 */

import { z } from "zod";

export const PASSWORD_MIN = 10;
export const PASSWORD_MAX = 128;

const email = z
  .string()
  .trim()
  .min(1, { error: "Enter your email address." })
  .pipe(z.email({ error: "Enter a valid email address, like name@example.com." }));

const newPassword = z
  .string()
  .min(PASSWORD_MIN, { error: `Use at least ${PASSWORD_MIN} characters.` })
  .max(PASSWORD_MAX, { error: `Use at most ${PASSWORD_MAX} characters.` });

const name = (label: string) =>
  z
    .string()
    .trim()
    .min(1, { error: `Enter your ${label}.` })
    .max(100, { error: `Use at most 100 characters.` });

const captchaToken = z.string().optional();

export const registerSchema = z.object({
  first_name: name("first name"),
  last_name: name("last name"),
  email,
  phone_country: z.string(),
  phone_number: z
    .string()
    .trim()
    .refine((value) => value === "" || /^[\d\s().-]{4,20}$/.test(value), {
      error: "Use digits only, without the country code.",
    }),
  password: newPassword,
  accept_terms: z.boolean().refine((accepted) => accepted, {
    error: "Accept the Terms of Use and Privacy Policy to continue.",
  }),
  captcha_token: captchaToken,
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

export const tokenSchema = z.object({ token: z.string().min(1) });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type EmailInput = z.infer<typeof emailSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type TokenInput = z.infer<typeof tokenSchema>;

/** First message per field, e.g. `{ email: "Enter a valid email address…" }`. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "");
    if (field && !errors[field]) errors[field] = issue.message;
  }
  return errors;
}
