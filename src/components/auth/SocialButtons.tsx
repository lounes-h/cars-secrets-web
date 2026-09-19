import { socialLoginAction } from "@/app/(auth)/actions";

export function SocialButtons({ intent }: { intent: "Sign in" | "Register" }) {
  return (
    <form action={socialLoginAction} aria-label={`${intent} with Google or Apple`}>
      <button type="submit" name="provider" value="google">
        {intent} with Google
      </button>
      <button type="submit" name="provider" value="apple">
        {intent} with Apple
      </button>
    </form>
  );
}
