import { type NextRequest } from "next/server";

import { updateSession } from "@/utils/supabase/middleware";

const publicPatterns = [
  "/api/webhooks/woocommerce/order-update",
  "/api/cron/process-emails",
  "/api/analytics/email-tracking/reviews/open/",
  "/api/analytics/email-tracking/reviews/clicks/",
  "/api/mail/list-unsubscribe",
  "/api/unsubscribe/email",
  "/api/unsubscribe/",
];

export async function middleware (request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublicRoute = publicPatterns.some(pattern =>
    pathname === pattern || pathname.startsWith(pattern)
  );

  if (isPublicRoute) {
    return;
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
