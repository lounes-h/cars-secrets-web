import { describe, expect, it } from "vitest";
import {
  fieldErrors,
  hasSpecialCharacter,
  isValidNationalNumber,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/lib/auth-schemas";
import { PHONE_FORMATS } from "@/lib/phone-formats";

const register = {
  first_name: "Dana",
  last_name: "Lee",
  email: " dana@example.com ",
  phone_country: "US",
  phone_number: "",
  password: "long-enough-pw!",
  accept_terms: true,
};

describe("registerSchema", () => {
  it("accepts a complete form and trims the email", () => {
    const result = registerSchema.safeParse(register);
    expect(result.success && result.data.email).toBe("dana@example.com");
  });

  it("accepts a national number of a length the country allows", () => {
    expect(registerSchema.safeParse({ ...register, phone_country: "FR", phone_number: "06 12 34 56 78" }).success).toBe(
      true,
    );
  });

  it("refuses a national number that is too short for its country", () => {
    const result = registerSchema.safeParse({ ...register, phone_country: "FR", phone_number: "06 12 34" });
    expect(!result.success && fieldErrors(result.error)).toEqual({
      phone_number: "Enter a valid phone number for the country you picked.",
    });
  });

  it("asks for a special character in the password", () => {
    const result = registerSchema.safeParse({ ...register, password: "abcdefghijkl" });
    expect(!result.success && fieldErrors(result.error)).toEqual({
      password: "Add at least one special character, like ! ? or #.",
    });
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
        phone_number: expect.stringMatching(/valid phone number/),
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
    const result = resetPasswordSchema.safeParse({ token: "t", password: "abcdefghij!", password_confirm: "other" });
    expect(!result.success && fieldErrors(result.error)).toEqual({ password_confirm: "The two passwords differ." });
  });
});

describe("hasSpecialCharacter", () => {
  it("counts anything that is not a letter or a digit", () => {
    expect(hasSpecialCharacter("abcdefghij")).toBe(false);
    expect(hasSpecialCharacter("abcdéfghij")).toBe(false);
    expect(hasSpecialCharacter("abcdefghi!")).toBe(true);
    expect(hasSpecialCharacter("abcdefg hi")).toBe(true);
  });
});

describe("isValidNationalNumber", () => {
  it("accepts the example number every country's placeholder shows", () => {
    const refused = Object.entries(PHONE_FORMATS).filter(([code, format]) => !isValidNationalNumber(code, format.example));
    expect(refused.map(([code]) => code)).toEqual([]);
  });

  it("measures the digits against the lengths the country allows", () => {
    expect(isValidNationalNumber("FR", "06 12 34 56 78")).toBe(true);
    expect(isValidNationalNumber("fr", "0612345678")).toBe(true);
    expect(isValidNationalNumber("FR", "0612345")).toBe(false);
    expect(isValidNationalNumber("US", "(201) 555-0123")).toBe(true);
    expect(isValidNationalNumber("US", "201555")).toBe(false);
  });

  it("falls back to a minimum of four digits for an unknown country", () => {
    expect(isValidNationalNumber("ZZ", "123")).toBe(false);
    expect(isValidNationalNumber("ZZ", "1234")).toBe(true);
  });
});
