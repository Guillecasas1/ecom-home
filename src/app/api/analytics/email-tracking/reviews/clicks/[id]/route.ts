// app/api/tracking/click/[id]/route.ts
import { db } from '@/db';
import { emailEvents, emailSends } from '@/db/schema';
import { sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function GET (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Obtener la URL original del parámetro de consulta
    const url = new URL(request.url);
    const originalUrl = url.searchParams.get('url');

    if (!originalUrl) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Buscar el envío por trackingId
    const [emailSend] = await db
      .select()
      .from(emailSends)
      .where(
        sql`${emailSends.metadata}->>'trackingId' = ${id}`
      )
      .limit(1);

    if (emailSend) {
      // Registrar evento de clic
      await db.insert(emailEvents).values({
        emailSendId: emailSend.id,
        eventType: 'click',
        eventTime: new Date(),
        userAgent: request.headers.get('user-agent') || '',
        url: originalUrl,
        metadata: {
          referrer: request.headers.get('referer') || ''
        }
      });
    }

    // Redirigir al usuario a la URL original
    return NextResponse.redirect(new URL(decodeURIComponent(originalUrl)));
  } catch (error) {
    console.error('Error tracking email click:', error);
    // En caso de error, redirigir a la página principal
    return NextResponse.redirect(new URL('/', request.url));
  }
}