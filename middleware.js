// middleware.js
import { NextResponse } from "next/server";
import { verifyToken } from "./lib/auth.js";

export function middleware(req) {
  const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];
  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });

  // Do NOT attach user to req (Next.js App Router requests are read-only)
  return NextResponse.next();
}

// Apply only to notes APIs
export const config = {
  matcher: ["/api/notes/:path*"],
};
