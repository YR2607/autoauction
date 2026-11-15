import { NextResponse, type NextRequest } from "next/server";

export function proxy(_request: NextRequest) {
  const response = NextResponse.next();
  if (process.env.DEMO_MODE === "1") {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return response;
}
