import { NextRequest, NextResponse } from "next/server";

/** Vercel serves the public website; the memory dashboard runs locally. */
export function middleware(request: NextRequest) {
  if (process.env.VERCEL !== "1") return NextResponse.next();

  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json(
      {
        error: "The Atlas memory API runs with your local dashboard.",
        instructions: "/local-dashboard",
      },
      { status: 403 },
    );
  }

  return NextResponse.redirect(new URL("/local-dashboard", request.url));
}

export const config = {
  matcher: ["/workspace/:path*", "/search", "/repo/:path*", "/session/:path*", "/api/:path*"],
};
