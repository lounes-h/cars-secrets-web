import { describe, expect, it } from "vitest";
import {
  authSchemas,
  codeDigits,
  fieldErrors,
  hasSpecialCharacter,
  isValidNationalNumber,
  PASSWORD_RULES,
  ruleWords,
} from "@/lib/auth-schemas";
import { PHONE_FORMATS } from "@/lib/phone-formats";
import { en } from "@/messages/en";
import { es } from "@/messages/es";

const { loginSchema, registerSchema, resetPasswordSchema } = authSchemas(en.auth);

const register = {
  first_name: "Dana",
  last_name: "Lee",
  email: " dana@example.com ",
  phone_country: "US",
  phone_number: "",
  password: "long-enough-pw1!",
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

  it("caps the names and the email", () => {
    const long = "a".repeat(101);
    const result = registerSchema.safeParse({ ...register, first_name: long, email: `${"a".repeat(250)}@b.co` });
    expect(!result.success && fieldErrors(result.error)).toEqual({
      first_name: "Use at most 100 characters.",
      email: "Use at most 254 characters.",
    });
  });

  it("names the first rule a new password breaks", () => {
    const problem = (password: string) => {
      const result = registerSchema.safeParse({ ...register, password });
      return result.success ? undefined : fieldErrors(result.error).password;
    };
    expect(problem("Ab1!")).toBe("Use at least 8 characters.");
    expect(problem("12345678!")).toBe("Add at least one letter.");
    expect(problem("abcdefghijkl!")).toBe("Add at least one number.");
    expect(problem("abcdefghijkl1")).toBe("Add at least one special character.");
    expect(problem("abcdefg1!")).toBeUndefined();
  });

  it("caps the password length", () => {
    const result = registerSchema.safeParse({ ...register, password: `a1!${"b".repeat(126)}` });
    expect(!result.success && fieldErrors(result.error)).toEqual({ password: "Use at most 128 characters." });
  });

  it("explains every problem on its own field", () => {
    const result = registerSchema.safeParse({
      ...register,
      first_name: " ",
      email: "nope",
      phone_number: "+1 415",
      password: "short",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(fieldErrors(result.error)).toEqual({
        first_name: "Enter your first name.",
        email: expect.stringMatching(/valid email/),
        phone_number: expect.stringMatching(/valid phone number/),
        password: "Use at least 8 characters.",
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
  it("applies the same password rules as registration", () => {
    const result = resetPasswordSchema.safeParse({ token: "t", password: "abcdefghij!", password_confirm: "abcdefghij!" });
    expect(!result.success && fieldErrors(result.error)).toEqual({ password: "Add at least one number." });
  });

  it("puts a mismatch on the confirmation field", () => {
    const result = resetPasswordSchema.safeParse({ token: "t", password: "abcdefghij1!", password_confirm: "other" });
    expect(!result.success && fieldErrors(result.error)).toEqual({ password_confirm: "The two passwords differ." });
  });
});

describe("codeDigits", () => {
  it("keeps the ASCII digits of a typed or pasted code, at most six", () => {
    expect(codeDigits("123 456")).toBe("123456");
    expect(codeDigits("123-456")).toBe("123456");
    expect(codeDigits("Your code: 042917. It expires in 10 minutes.")).toBe("042917");
    expect(codeDigits("12")).toBe("12");
    expect(codeDigits("١٢٣abc")).toBe("");
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

describe("authSchemas", () => {
  it("builds each language's schemas once", () => {
    expect(authSchemas(en.auth)).toBe(authSchemas(en.auth));
    expect(authSchemas(es.auth)).not.toBe(authSchemas(en.auth));
  });

  it("gives its messages in the language it was built for", () => {
    const result = authSchemas(es.auth).loginSchema.safeParse({ email: "", password: "", remember: false });
    expect(!result.success && fieldErrors(result.error)).toEqual({
      email: es.auth.validation.emailRequired,
      password: es.auth.validation.passwordRequired,
    });
  });
});

describe("ruleWords", () => {
  it("fills in the minimum length", () => {
    expect(PASSWORD_RULES.map((rule) => ruleWords(en.auth, rule.key).text)).toEqual([
      "At least 8 characters",
      "At least one letter",
      "At least one number",
      "At least one special character",
    ]);
    expect(ruleWords(en.auth, "length").error).toBe("Use at least 8 characters.");
  });
});
