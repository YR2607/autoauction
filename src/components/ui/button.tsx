import { cn } from "@/lib/utils";
import { forwardRef } from "react";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "dark";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-[#0b3b60] text-white hover:bg-[#072a47] border border-[#072a47] active:bg-[#051a2e]",
  secondary:
    "bg-[#ffb81c] text-[#051a2e] hover:bg-[#e5a519] border border-[#d4960d] font-bold active:bg-[#c98e0c]",
  outline:
    "border border-[#cbd5e1] bg-white text-[#1e293b] hover:bg-[#f1f5f9] hover:border-[#94a3b8] active:bg-[#e2e8f0]",
  ghost:
    "text-[#0b3b60] hover:bg-[#e2eaf2] active:bg-[#cbd5e1]",
  danger:
    "bg-[#cc0000] text-white hover:bg-[#990000] border border-[#990000] active:bg-[#770000]",
  dark:
    "bg-[#07223d] text-white hover:bg-[#051a2e] border border-[#051a2e] active:bg-[#030f1c]",
};

const sizes: Record<Size, string> = {
  sm: "h-7 px-2.5 text-xs uppercase tracking-wider font-bold",
  md: "h-9 px-4 text-xs uppercase tracking-wider font-bold",
  lg: "h-10 px-5 text-sm uppercase tracking-wider font-bold",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-none select-none text-center cursor-pointer transition-colors duration-100",
        "disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed",
        "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#0b3b60]",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading && (
        <span
          aria-hidden
          className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  ),
);
Button.displayName = "Button";

export const IconButton = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: "light" | "dark" | "glass" }
>(({ className, tone = "light", ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "inline-flex h-8 w-8 items-center justify-center rounded-none transition-colors border",
      "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#0b3b60]",
      "disabled:pointer-events-none disabled:opacity-50",
      tone === "light" && "bg-white text-[#1e293b] border-[#cbd5e1] hover:bg-[#f1f5f9]",
      tone === "dark" && "bg-[#0b3b60] text-white border-[#072a47] hover:bg-[#072a47]",
      tone === "glass" && "bg-[#051a2e]/80 text-white border-white/20 hover:bg-[#051a2e]",
      className,
    )}
    {...props}
  />
));
IconButton.displayName = "IconButton";
