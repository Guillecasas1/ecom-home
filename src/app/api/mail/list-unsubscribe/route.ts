import { NextRequest, NextResponse } from "next/server";

import { eq } from "drizzle-orm";
import nodemailer from "nodemailer";

import { db } from "@/db";
import { subscribers } from "@/db/schema";
import { env } from "@/utils/env/server";

/**
 * This endpoint handles List-Unsubscribe-Post requests according to RFC 8058
 * https://datatracker.ietf.org/doc/html/rfc8058
 * 
 * It's for handling one-click unsubscribe functionality supported by modern email clients.
 */
export async function POST (request: NextRequest) {
  try {
    // The Content-Type for List-Unsubscribe-Post must be multipart/form-data
    const formData = await request.formData();

    // Get the List-Unsubscribe values
    const email = formData.get("email") as string;
    // Optional unique identifier that can be used to track the specific message
    const messageId = formData.get("message-id") as string | null;

    if (!email) {
      return NextResponse.json(
        { error: "Email address is required" },
        { status: 400 }
      );
    }

    // Find the subscriber by email
    const [subscriber] = await db
      .select()
      .from(subscribers)
      .where(eq(subscribers.email, email))
      .limit(1);

    if (!subscriber) {
      return NextResponse.json(
        { error: "Subscriber not found" },
        { status: 404 }
      );
    }

    // Update the subscriber to mark as unsubscribed
    await db
      .update(subscribers)
      .set({
        isActive: false,
        unsubscribedAt: new Date(),
        customAttributes: {
          ...(subscriber.customAttributes || {}),
          unsubscribeSource: "list_unsubscribe_header",
          unsubscribeMessageId: messageId || undefined,
          lastUnsubscribeDate: new Date().toISOString(),
        },
      })
      .where(eq(subscribers.id, subscriber.id));

    // Log the unsubscribe event
    console.info(`Subscriber ${subscriber.email} unsubscribed via List-Unsubscribe`, {
      messageId,
      subscriberId: subscriber.id,
    });

    // Optionally send a confirmation email
    await sendUnsubscribeConfirmation(subscriber.email);

    // Return success
    return NextResponse.json({
      success: true,
      message: "Subscriber has been unsubscribed successfully",
    });
  } catch (error) {
    console.error("Error processing List-Unsubscribe request:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * Sends a confirmation email to the subscriber that they have been unsubscribed
 */
async function sendUnsubscribeConfirmation (email: string) {
  try {
    const transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: parseInt(env.SMTP_PORT),
      secure: env.SMTP_SECURE === "true",
      auth: {
        user: env.SMTP_USERNAME,
        pass: env.SMTP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"Ecom Home" <${env.SMTP_USERNAME}>`,
      to: email,
      subject: "You have been unsubscribed",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">You have been unsubscribed</h1>
          <p>You have been successfully unsubscribed from our mailing list. You will no longer receive marketing emails from us.</p>
          <p>If this was a mistake, you can <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://ecom-home.vercel.app"
        }/unsubscribe?email=${encodeURIComponent(
          email
        )}">manage your preferences</a> at any time.</p>
          <p>Thank you for your interest in our products.</p>
        </div>
      `,
    });

    return true;
  } catch (error) {
    console.error("Error sending unsubscribe confirmation:", error);
    return false;
  }
}