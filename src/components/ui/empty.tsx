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
        "flex flex-col items-center justify-center rounded-[14px] border border-error/25 bg-error/5 px-6 py-12 text-center",
        className,
      )}
    >
      <TriangleAlert className="h-8 w-8 text-error" />
      <h3 className="mt-3 font-display text-base font-bold text-graphite">{title}</h3>
      {body && <p className="mt-1 max-w-sm text-sm text-muted">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
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
        "flex flex-col items-center justify-center rounded-[14px] border border-dashed border-line bg-white px-6 py-16 text-center",
        className,
      )}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-graphite/5 text-xl text-muted">
        ∅
      </div>
      <h3 className="font-display text-base font-bold text-graphite">{title}</h3>
      {body && <p className="mt-1 max-w-sm text-sm text-muted">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
