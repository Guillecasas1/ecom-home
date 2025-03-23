// app/api/tracking/open/[id]/route.ts
import { db } from '@/db';
import { emailEvents, emailSends } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { NextRequest } from 'next/server';

export async function GET (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Buscar el envío por trackingId
    const [emailSend] = await db
      .select()
      .from(emailSends)
      .where(
        sql`${emailSends.metadata}->>'trackingId' = ${id}`
      )
      .limit(1);

    if (emailSend) {
      // Registrar evento de apertura
      await db.insert(emailEvents).values({
        emailSendId: emailSend.id,
        eventType: 'open',
        eventTime: new Date(),
        userAgent: request.headers.get('user-agent') || '',
        metadata: {
          referrer: request.headers.get('referer') || ''
        }
      });

      // Actualizar el campo openedAt si es la primera apertura
      if (!emailSend.openedAt) {
        await db.update(emailSends)
          .set({ openedAt: new Date() })
          .where(eq(emailSends.id, emailSend.id));
      }
    }

    // Devolver una imagen transparente 1x1 pixel
    return new Response(
      Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'),
      {
        headers: {
          'Content-Type': 'image/gif',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  } catch (error) {
    console.error('Error tracking email open:', error);
    // Seguir devolviendo la imagen transparente para no romper el email
    return new Response(
      Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'),
      { headers: { 'Content-Type': 'image/gif' } }
    );
  }
}