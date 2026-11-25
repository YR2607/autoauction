import { cn } from "@/lib/utils";
import { forwardRef } from "react";

export const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-11 w-full border border-line bg-white px-4 text-sm text-graphite",
      "placeholder:text-muted/70 transition-colors",
      "focus:border-graphite/50 focus:outline-none focus:ring-2 focus:ring-graphite/10",
      "disabled:bg-bg disabled:text-muted",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "w-full border border-line bg-white px-4 py-3 text-sm text-graphite",
      "placeholder:text-muted/70 transition-colors min-h-28",
      "focus:border-graphite/50 focus:outline-none focus:ring-2 focus:ring-graphite/10",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "h-11 w-full appearance-none border border-line bg-white px-4 pr-9 text-sm text-graphite",
      "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222.5%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22/%3E%3C/svg%3E')]",
      "bg-[position:right_14px_center] bg-no-repeat",
      "focus:border-graphite/50 focus:outline-none focus:ring-2 focus:ring-graphite/10",
      className,
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1.5 block font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-graphite2", className)}
      {...props}
    />
  );
}
