import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const base =
  "w-full rounded-[var(--radius-sm)] border border-border bg-surface-3 px-3.5 py-3 text-[15px] text-foreground placeholder:text-muted-2 transition-[border-color,box-shadow] focus:border-[var(--accent-line)] focus:outline-none focus:shadow-[0_0_0_3px_var(--accent-soft)]";

export const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(base, "h-11", className)} {...props} />
));
Input.displayName = "Input";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(base, "min-h-[120px] resize-none leading-relaxed", className)}
    {...props}
  />
));
Textarea.displayName = "Textarea";

/** Mono, uppercase field label per the design system. */
export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-muted",
        className,
      )}
      {...props}
    />
  );
}
