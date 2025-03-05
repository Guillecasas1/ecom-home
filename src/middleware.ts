import { type NextRequest } from "next/server";

import { updateSession } from "@/utils/supabase/middleware";

const publicRoutes = [
  '/api/webhooks/woocommerce/order-update',
  '/api/cron/process-emails',
]

export async function middleware (request: NextRequest) {
  const { pathname } = request.nextUrl

  if (publicRoutes.includes(pathname)) {
    return;
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}