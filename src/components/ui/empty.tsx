import { cn } from "@/lib/utils";
import { TriangleAlert } from "lucide-react";

export function ErrorState({
  title = "Something went wrong",
  body,
  action,
  className,
}: {
  title?: string;
  body?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center rounded-none border border-[#fca5a5] bg-[#fef2f2] px-6 py-10 text-center",
        className,
      )}
    >
      <TriangleAlert className="h-7 w-7 text-[#dc2626]" />
      <h3 className="mt-2 text-sm font-bold uppercase tracking-wider text-[#1e293b]">{title}</h3>
      {body && <p className="mt-1 max-w-sm text-xs text-[#64748b]">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
  className,
}: {
  title: string;
  body?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-none border border-dashed border-[#cbd5e1] bg-white px-6 py-12 text-center",
        className,
      )}
    >
      <h3 className="text-sm font-bold uppercase tracking-wider text-[#0b3b60]">{title}</h3>
      {body && <p className="mt-1 max-w-sm text-xs text-[#64748b]">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
