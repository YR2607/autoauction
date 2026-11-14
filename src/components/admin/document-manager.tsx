"use client";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Trash2, Upload, Lock, Globe } from "lucide-react";

export type DocItem = {
  id: string;
  title: string;
  kind: string;
  isPublic: boolean;
};

export function DocumentManager({
  vehicleId,
  documents,
}: {
  vehicleId: string;
  documents: DocItem[];
}) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const titleInput = useRef<HTMLInputElement>(null);
  const kindInput = useRef<HTMLSelectElement>(null);
  const publicInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function upload(file: File) {
    setBusy(true);
    setErr(null);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("title", titleInput.current?.value || file.name);
    fd.append("kind", kindInput.current?.value || "other");
    fd.append("isPublic", publicInput.current?.checked ? "true" : "false");
    const r = await fetch(`/api/admin/vehicles/${vehicleId}/documents`, { method: "POST", body: fd });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) setErr(d.error ?? "Upload failed");
    if (titleInput.current) titleInput.current.value = "";
    router.refresh();
    setBusy(false);
  }

  async function remove(documentId: string) {
    setBusy(true);
    await fetch(`/api/admin/vehicles/${vehicleId}/documents`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentId }),
    });
    router.refresh();
    setBusy(false);
  }

  return (
    <div>
      <input
        ref={input}
        type="file"
        accept=".pdf,image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
          e.target.value = "";
        }}
      />
      <div className="space-y-2">
        <input
          ref={titleInput}
          placeholder="Document title"
          className="w-full rounded-md border border-line px-3 py-2 text-sm"
        />
        <div className="flex items-center gap-2">
          <select ref={kindInput} className="flex-1 rounded-md border border-line px-2 py-2 text-sm">
            <option value="inspection">Inspection report</option>
            <option value="registration">Registration</option>
            <option value="ownership">Ownership</option>
            <option value="other">Other</option>
          </select>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-muted">
            <input ref={publicInput} type="checkbox" /> Public
          </label>
        </div>
        <Button variant="outline" size="sm" disabled={busy} onClick={() => input.current?.click()} className="w-full">
          <Upload className="h-4 w-4" /> {busy ? "Working…" : "Upload document"}
        </Button>
      </div>
      {err && <p className="mt-2 text-xs font-semibold text-error">{err}</p>}

      <ul className="mt-4 space-y-2">
        {documents.map((d) => (
          <li key={d.id} className="flex items-center gap-2 rounded-lg border border-line px-3 py-2">
            <FileText className="h-4 w-4 shrink-0 text-muted" />
            <div className="min-w-0 flex-1">
              <a href={`/api/documents/${d.id}`} target="_blank" className="block truncate text-sm font-semibold text-ink hover:underline">
                {d.title}
              </a>
              <p className="flex items-center gap-1 text-[11px] text-muted">
                {d.kind} · {d.isPublic ? <><Globe className="h-3 w-3" /> public</> : <><Lock className="h-3 w-3" /> admin only</>}
              </p>
            </div>
            <button onClick={() => remove(d.id)} className="rounded p-1 text-error hover:bg-error/10" aria-label="Delete document">
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
      {documents.length === 0 && <p className="mt-3 text-center text-xs text-muted">No documents yet.</p>}
    </div>
  );
}
