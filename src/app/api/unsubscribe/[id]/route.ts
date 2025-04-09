import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

import { eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { emailEvents, emailSends, subscribers } from "@/db/schema";

export async function GET (
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const url = new URL(request.url);
    const subscriberId = url.searchParams.get("sid");
    const source = url.searchParams.get("source") || "unknown";
    const redirectUrl = url.searchParams.get("redirect") || "/unsubscribed";

    if (!subscriberId) {
      console.error("Missing subscriber ID in unsubscribe request");
      return redirect("/error?reason=invalid_request");
    }

    // Find the subscriber
    const [subscriber] = await db
      .select()
      .from(subscribers)
      .where(eq(subscribers.id, parseInt(subscriberId, 10)))
      .limit(1);

    if (!subscriber) {
      console.error(`Subscriber with ID ${subscriberId} not found`);
      return redirect("/error?reason=subscriber_not_found");
    }

    // Attempt to find the related email send using the tracking ID
    const [emailSend] = await db
      .select()
      .from(emailSends)
      .where(
        sql`${emailSends.metadata}->>'trackingId' = ${id}`
      )
      .limit(1);

    // Update the subscriber to mark as unsubscribed
    await db
      .update(subscribers)
      .set({
        isActive: false,
        unsubscribedAt: new Date(),
        customAttributes: {
          ...(subscriber.customAttributes || {}),
          unsubscribeSource: source,
          lastUnsubscribeDate: new Date().toISOString(),
        },
      })
      .where(eq(subscribers.id, subscriber.id));

    // If we found the email send, record an unsubscribe event
    if (emailSend) {
      await db.insert(emailEvents).values({
        emailSendId: emailSend.id,
        eventType: "unsubscribe",
        eventTime: new Date(),
        userAgent: request.headers.get("user-agent") || "",
        metadata: {
          source,
          referrer: request.headers.get("referer") || "",
          trackingId: id,
        },
      });
    }

    // Return success with a redirect to a thank you page
    console.info(`Subscriber ${subscriber.email} has been unsubscribed successfully`);
    return redirect(redirectUrl);
  } catch (error) {
    console.error("Error processing unsubscribe request:", error);
    return redirect("/error?reason=server_error");
  }
}