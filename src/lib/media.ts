// Server-side media validation — never trust client-declared MIME types.
// Sniff magic bytes and derive the extension from the actual content.

export type ImageKind = "jpg" | "png" | "webp" | "avif";
export type DocKind = "pdf" | "jpg" | "png" | "webp";

export function sniffImage(buf: Buffer): ImageKind | null {
  if (buf.length < 12) return null;
  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 &&
    buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a
  )
    return "png";
  // WebP: "RIFF" .... "WEBP"
  if (
    buf.subarray(0, 4).toString("ascii") === "RIFF" &&
    buf.subarray(8, 12).toString("ascii") === "WEBP"
  )
    return "webp";
  // AVIF: .... "ftyp" + brand avif/avis
  if (
    buf.subarray(4, 8).toString("ascii") === "ftyp" &&
    ["avif", "avis"].includes(buf.subarray(8, 12).toString("ascii"))
  )
    return "avif";
  return null;
}

export function sniffDocument(buf: Buffer): DocKind | null {
  if (buf.length < 12) return null;
  // PDF: %PDF-
  if (buf.subarray(0, 5).toString("ascii") === "%PDF-") return "pdf";
  const img = sniffImage(buf);
  if (img === "avif") return null; // documents: jpg/png/webp/pdf only
  return img;
}
