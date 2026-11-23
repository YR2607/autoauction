import Link from "next/link";

export function Pagination({
  page,
  perPage,
  total,
  params,
  basePath,
}: {
  page: number;
  perPage: number;
  total: number;
  params: Record<string, string | string[] | undefined>;
  basePath: string;
}) {
  const pages = Math.max(1, Math.ceil(total / perPage));
  if (pages <= 1) return null;

  const href = (p: number) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (typeof v === "string") q.set(k, v);
    }
    q.set("page", String(p));
    return `${basePath}?${q.toString()}`;
  };

  return (
    <nav className="mt-10 flex items-center justify-center gap-2">
      {page > 1 && (
        <Link href={href(page - 1)} className="rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold hover:bg-bg">
          ← Prev
        </Link>
      )}
      <span className="px-3 text-sm font-semibold text-muted">
        Page {page} of {pages}
      </span>
      {page < pages && (
        <Link href={href(page + 1)} className="rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold hover:bg-bg">
          Next →
        </Link>
      )}
    </nav>
  );
}
