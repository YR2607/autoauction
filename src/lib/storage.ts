import path from "node:path";

// Private document store — outside public/, never directly served.
// Public vehicle images live under public/uploads instead.
export function docStoreDir(): string {
  return (
    process.env.DOCUMENTS_DIR ?? path.join(process.cwd(), "data", "documents")
  );
}
