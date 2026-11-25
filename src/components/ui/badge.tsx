import { cn } from "@/lib/utils";

const tones = {
  live: "bg-error/10 text-error",
  success: "bg-success/10 text-success",
  warning: "bg-warning/15 text-[#92600a]",
  neutral: "bg-graphite/5 text-muted",
  primary: "bg-primary/10 text-primary",
  dark: "bg-ink text-white",
} as const;

export function Badge({
  tone = "neutral",
  className,
  children,
  pulse,
}: {
  tone?: keyof typeof tones;
  className?: string;
  children: React.ReactNode;
  pulse?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.1em]",
        tones[tone],
        className,
      )}
    >
      {pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
        </span>
      )}
      {children}
    </span>
  );
}
