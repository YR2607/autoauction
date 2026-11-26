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
    <nav className="mt-8 flex items-center justify-center gap-2">
      {page > 1 && (
        <Link
          href={href(page - 1)}
          className="rounded-none border border-[#cbd5e1] bg-white px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-[#0b3b60] hover:bg-[#f1f5f9]"
        >
          Previous
        </Link>
      )}
      <span className="px-3 text-xs font-bold text-[#64748b]">
        Page {page} of {pages}
      </span>
      {page < pages && (
        <Link
          href={href(page + 1)}
          className="rounded-none border border-[#cbd5e1] bg-white px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-[#0b3b60] hover:bg-[#f1f5f9]"
        >
          Next
        </Link>
      )}
    </nav>
  );
}
