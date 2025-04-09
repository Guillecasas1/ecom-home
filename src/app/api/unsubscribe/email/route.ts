import { NextRequest, NextResponse } from "next/server";

import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { subscribers } from "@/db/schema";

// Schema for validating incoming unsubscribe requests
const unsubscribeRequestSchema = z.object({
  email: z.string().email("Invalid email address"),
  reason: z.string().optional(),
  source: z.string().optional(),
});

export async function POST (request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();

    // Validate the request
    const result = unsubscribeRequestSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: result.error.format() },
        { status: 400 }
      );
    }

    const { email, reason = "user_request", source = "api" } = result.data;

    // Find the subscriber
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

    // Update subscriber to mark as unsubscribed
    await db
      .update(subscribers)
      .set({
        isActive: false,
        unsubscribedAt: new Date(),
        customAttributes: {
          ...(subscriber.customAttributes || {}),
          unsubscribeReason: reason,
          unsubscribeSource: source,
          lastUnsubscribeDate: new Date().toISOString(),
        },
      })
      .where(eq(subscribers.id, subscriber.id));

    // Return success
    return NextResponse.json({
      success: true,
      message: "Subscriber has been unsubscribed successfully",
    });
  } catch (error) {
    console.error("Error processing unsubscribe request:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}