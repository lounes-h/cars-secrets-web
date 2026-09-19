/** Human text for the error codes that reach a page through the URL (social login callbacks). */
const MESSAGES: Record<string, string> = {
  invalid_state: "The sign-in attempt expired or was tampered with. Please try again.",
  provider_denied: "The sign-in was cancelled.",
  provider_not_configured: "This sign-in method is not available yet.",
  invalid_token: "The provider did not confirm your identity. Please try again.",
  email_required: "The provider did not share an email address, which we need for your account.",
  email_unverified: "That email address is not verified with the provider, so it cannot be used here.",
  unavailable: "The service is temporarily unavailable. Please try again in a moment.",
};

export function messageFor(code: string): string {
  return MESSAGES[code] ?? "Something went wrong. Please try again.";
}
