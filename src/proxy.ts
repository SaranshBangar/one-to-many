import { NextResponse, type NextRequest, type NextFetchEvent } from "next/server";
import { clerkMiddleware } from "@clerk/nextjs/server";
import { isClerkConfigured } from "@/lib/env";

// When Clerk isn't configured (mock mode) we skip auth middleware entirely so the
// app runs with a fake demo user. When it is, Clerk handles session resolution.
const clerk = clerkMiddleware();

export default function middleware(req: NextRequest, ev: NextFetchEvent) {
  if (!isClerkConfigured) return NextResponse.next();
  return clerk(req, ev);
}

export const config = {
  matcher: [
    // Skip Next internals and static files, run on everything else + API.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
