import { Alert, AlertTitle } from "@/components/ui/alert";

/** A message about the whole form (wrong password, service down…). */
export function FormError({ message, children }: { message?: string; children?: React.ReactNode }) {
  if (!message) return null;
  return (
    <Alert variant="destructive">
      <AlertTitle className="font-semibold">
        {message}
        {children}
      </AlertTitle>
    </Alert>
  );
}
