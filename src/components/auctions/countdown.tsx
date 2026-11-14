"use client";
import { useEffect, useState } from "react";

function fmt(ms: number) {
  if (ms <= 0) return "Ended";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  if (d > 0) return `${d}d ${pad(h)}:${pad(m)}:${pad(sec)}`;
  return `${pad(h)}:${pad(m)}:${pad(sec)}`;
}

export function Countdown({
  endsAt,
  className,
  serverDriftMs = 0,
}: {
  endsAt: number;
  className?: string;
  serverDriftMs?: number;
}) {
  const [left, setLeft] = useState(() => endsAt - Date.now() - serverDriftMs);
  useEffect(() => {
    setLeft(endsAt - Date.now() - serverDriftMs);
    const i = setInterval(
      () => setLeft(endsAt - Date.now() - serverDriftMs),
      1000,
    );
    return () => clearInterval(i);
  }, [endsAt, serverDriftMs]);
  return <span className={className}>{fmt(left)}</span>;
}
