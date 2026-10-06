import { socialLoginAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";

export function SocialButtons({ intent }: { intent: "Sign in" | "Register" }) {
  return (
    <form action={socialLoginAction} aria-label={`${intent} with Google or Apple`} className="flex flex-col gap-2">
      <Button type="submit" name="provider" value="google" variant="outline" size="xl" className="w-full">
        <GoogleMark />
        {intent} with Google
      </Button>
      <Button type="submit" name="provider" value="apple" variant="outline" size="xl" className="w-full">
        <AppleMark />
        {intent} with Apple
      </Button>
    </form>
  );
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

function AppleMark() {
  return (
    <svg aria-hidden="true" width="16" height="18" viewBox="0 0 814 1000" fill="currentColor">
      <path d="M788 341c-6 4-110 63-110 193 0 151 132 204 136 206-1 3-21 73-70 145-43 63-89 126-158 126s-87-40-167-40c-78 0-106 41-169 41s-107-58-158-129C33 800 0 650 0 509c0-227 148-347 293-347 77 0 142 51 190 51 46 0 118-54 206-54 33 0 153 3 229 111zM554 158c36-43 61-102 61-162 0-8-1-17-2-23-58 2-127 39-169 87-33 37-63 96-63 156 0 9 1 18 2 21 4 1 10 2 16 2 52 0 117-35 155-81z" />
    </svg>
  );
}
