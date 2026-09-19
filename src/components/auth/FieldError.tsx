export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1">
      {message}
    </p>
  );
}

/** A message about the whole form (wrong password, service down…). */
export function FormError({ message, children }: { message?: string; children?: React.ReactNode }) {
  if (!message) return null;
  return (
    <div role="alert" className="notice">
      {message}
      {children}
    </div>
  );
}
