export function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    <span
      className={`font-display text-lg font-extrabold tracking-tight ${
        inverted ? "text-white" : "text-ink"
      }`}
    >
      AutoAuction
    </span>
  );
}
