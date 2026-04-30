import React from "react";

interface EditorialFieldProps {
  label: string;
  htmlFor: string;
  helperText?: string;
  error?: string;
  required?: boolean;
  eyebrow?: string;
  className?: string;
  children: React.ReactNode;
}

export default function EditorialField({
  label,
  htmlFor,
  helperText,
  error,
  required = false,
  eyebrow,
  className = "",
  children,
}: EditorialFieldProps) {
  // Only reference helper text if it will actually be rendered.
  // Helper text is hidden when an error is showing, so the helper id
  // would point at a non-existent element in that state.
  const helperRendered = !!helperText && !error;
  const describedBy = [
    helperRendered ? `${htmlFor}-help` : null,
    error ? `${htmlFor}-error` : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {eyebrow ? (
        <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--sl-silver)]">
          {eyebrow}
        </span>
      ) : null}
      <label
        htmlFor={htmlFor}
        className="font-mono text-[11px] uppercase tracking-[0.32em] text-[var(--sl-cream)]"
      >
        {label}
        {required ? (
          <span aria-hidden className="ml-1 text-[var(--sl-silver)]">
            *
          </span>
        ) : null}
      </label>
      <div
        data-error={error ? "true" : undefined}
        className="border-b border-[var(--sl-mist)]/30 focus-within:border-[var(--sl-cream)] data-[error=true]:border-[var(--status-danger-text)] transition-colors"
      >
        {React.isValidElement(children)
          ? React.cloneElement(
              children as React.ReactElement<Record<string, unknown>>,
              {
                id: htmlFor,
                "aria-required": required || undefined,
                "aria-invalid": error ? true : undefined,
                "aria-describedby": describedBy || undefined,
              },
            )
          : children}
      </div>
      {helperText && !error ? (
        <p
          id={`${htmlFor}-help`}
          className="font-body text-xs text-[var(--sl-silver)]"
        >
          {helperText}
        </p>
      ) : null}
      {error ? (
        <p
          id={`${htmlFor}-error`}
          className="font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--status-danger-text)]"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
