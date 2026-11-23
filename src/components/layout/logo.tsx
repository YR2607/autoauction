export function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt="AutoAuction"
      className={inverted ? "h-9 w-auto brightness-0 invert" : "h-9 w-auto"}
    />
  );
}
