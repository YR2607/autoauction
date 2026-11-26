export function Logo({ inverted = false, className }: { inverted?: boolean; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={inverted ? "/logo-light.png" : "/logo.png"}
      alt="AutoAuction"
      className={className ?? "h-9 w-auto"}
    />
  );
}
