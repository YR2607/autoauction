import { cn } from "@/lib/utils";
import { forwardRef } from "react";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "dark";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-cta text-white hover:bg-cta-hover",
  secondary: "bg-graphite text-white hover:bg-ink",
  outline:
    "border border-line bg-white text-graphite hover:border-graphite/40 hover:bg-bg",
  ghost: "text-graphite hover:bg-graphite/5",
  danger: "bg-error text-white hover:bg-error/90",
  dark: "bg-ink text-white hover:bg-graphite",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-[13px]",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-7 text-[15px]",
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
        "inline-flex items-center justify-center gap-2 font-semibold",
        "transition-colors duration-150 active:scale-[0.99]",
        "disabled:pointer-events-none disabled:opacity-50",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading && (
        <span
          aria-hidden
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
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
      "inline-flex h-10 w-10 items-center justify-center transition-colors",
      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta",
      "disabled:pointer-events-none disabled:opacity-50",
      tone === "light" && "bg-white text-graphite shadow-sm hover:bg-bg",
      tone === "dark" && "bg-graphite/10 text-graphite hover:bg-graphite/15",
      tone === "glass" && "bg-ink/60 text-white backdrop-blur-sm hover:bg-ink/80",
      className,
    )}
    {...props}
  />
));
IconButton.displayName = "IconButton";
