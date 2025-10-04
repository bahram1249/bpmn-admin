import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("bpmn_bearer")?.value;
  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set(
      "redirect",
      req.nextUrl.pathname + req.nextUrl.search
    );
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/processes/:path*",
    "/activities/:path*",
    "/nodes/:path*",
    "/requests/:path*",
    "/request-states/:path*",
    "/conditions/:path*",
    "/actions/:path*",
  ],
};
