import { describe, expect, it } from "vitest";
import { fieldErrors, loginSchema, registerSchema, resetPasswordSchema } from "@/lib/auth-schemas";

const register = {
  first_name: "Dana",
  last_name: "Lee",
  email: " dana@example.com ",
  phone_country: "US",
  phone_number: "",
  password: "long-enough-pw",
  accept_terms: true,
};

describe("registerSchema", () => {
  it("accepts a complete form and trims the email", () => {
    const result = registerSchema.safeParse(register);
    expect(result.success && result.data.email).toBe("dana@example.com");
  });

  it("explains every problem on its own field", () => {
    const result = registerSchema.safeParse({
      ...register,
      first_name: " ",
      email: "nope",
      phone_number: "+1 415",
      password: "short",
      accept_terms: false,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(fieldErrors(result.error)).toEqual({
        first_name: "Enter your first name.",
        email: expect.stringMatching(/valid email/),
        phone_number: expect.stringMatching(/digits only/),
        password: "Use at least 10 characters.",
        accept_terms: expect.stringMatching(/Terms of Use/),
      });
    }
  });
});

describe("loginSchema", () => {
  it("asks for both fields", () => {
    const result = loginSchema.safeParse({ email: "", password: "", remember: false });
    expect(!result.success && fieldErrors(result.error)).toEqual({
      email: "Enter your email address.",
      password: "Enter your password.",
    });
  });
});

describe("resetPasswordSchema", () => {
  it("puts a mismatch on the confirmation field", () => {
    const result = resetPasswordSchema.safeParse({ token: "t", password: "abcdefghij", password_confirm: "other" });
    expect(!result.success && fieldErrors(result.error)).toEqual({ password_confirm: "The two passwords differ." });
  });
});
