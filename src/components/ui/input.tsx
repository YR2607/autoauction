import { cn } from "@/lib/utils";
import { forwardRef } from "react";

export const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-8 w-full rounded-none border border-[#cbd5e1] bg-white px-2.5 text-xs text-[#1e293b]",
      "placeholder:text-[#94a3b8] transition-colors",
      "focus:border-[#0b3b60] focus:outline-none focus:ring-1 focus:ring-[#0b3b60]",
      "disabled:bg-[#f1f5f9] disabled:text-[#94a3b8]",
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
      "w-full rounded-none border border-[#cbd5e1] bg-white px-2.5 py-2 text-xs text-[#1e293b]",
      "placeholder:text-[#94a3b8] transition-colors min-h-24",
      "focus:border-[#0b3b60] focus:outline-none focus:ring-1 focus:ring-[#0b3b60]",
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
      "h-8 w-full appearance-none rounded-none border border-[#cbd5e1] bg-white px-2.5 pr-8 text-xs text-[#1e293b]",
      "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2210%22%20height%3D%2210%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23475569%22%20stroke-width%3D%222.5%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22/%3E%3C/svg%3E')]",
      "bg-[position:right_10px_center] bg-no-repeat",
      "focus:border-[#0b3b60] focus:outline-none focus:ring-1 focus:ring-[#0b3b60]",
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
      className={cn("mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#334155]", className)}
      {...props}
    />
  );
}
