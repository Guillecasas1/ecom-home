import { type NextRequest } from "next/server";

import { updateSession } from "@/utils/supabase/middleware";

const publicPatterns = [
  "/api/webhooks/woocommerce/order-update",
  "/api/webhooks/woocommerce/stock-update",
  "/api/webhooks/woocommerce/stock-notifications",
  "/api/cron/process-emails",
  "/api/analytics/email-tracking/reviews/open",
  "/api/analytics/email-tracking/reviews/clicks",
  "/api/mail/list-unsubscribe",
  "/api/unsubscribe/email",
  "/unsubscribe",
  "/unsubscribed",
  "/error",
];

// Páginas y endpoints públicos adicionales para unsubscribe
const publicPrefixes = [
  "/api/unsubscribe/"
];

export async function middleware (request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Verificar si la ruta coincide exactamente con alguna de las rutas públicas
  if (publicPatterns.includes(pathname)) {
    return;
  }

  // Verificar si la ruta comienza con alguno de los prefijos públicos
  if (publicPrefixes.some(prefix => pathname.startsWith(prefix))) {
    return;
  }

  // Verificar para rutas dinámicas específicas con segmentos variables
  if (
    pathname.match(/^\/api\/analytics\/email-tracking\/reviews\/open\/.*/) ||
    pathname.match(/^\/api\/analytics\/email-tracking\/reviews\/clicks\/.*/) ||
    pathname.match(/^\/api\/unsubscribe\/[^\/]+$/)
  ) {
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