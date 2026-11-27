import { cn } from "@/lib/utils";

const tones = {
  live: "bg-[#cc0000] text-white font-bold",
  success: "bg-[#15803d] text-white font-bold",
  warning: "bg-[#b45309] text-white font-bold",
  neutral: "bg-[#f1f5f9] text-[#334155] border border-[#cbd5e1] font-semibold",
  primary: "bg-[#0b3b60] text-white font-bold",
  dark: "bg-[#07223d] text-white font-bold",
} as const;

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: keyof typeof tones;
  className?: string;
  children: React.ReactNode;
  pulse?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-none px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
