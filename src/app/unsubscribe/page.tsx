"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const unsubscribeSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  reason: z.string().min(1, "Please select a reason"),
  comments: z.string().optional(),
});

type UnsubscribeFormValues = z.infer<typeof unsubscribeSchema>;

export default function UnsubscribePage () {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<UnsubscribeFormValues>({
    resolver: zodResolver(unsubscribeSchema),
    defaultValues: {
      email,
      reason: "",
      comments: "",
    },
  });

  async function onSubmit (values: UnsubscribeFormValues) {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/unsubscribe/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: values.email,
          reason: values.reason,
          comments: values.comments,
          source: "unsubscribe_form",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to unsubscribe");
      }

      // Redirect to success page
      router.push("/unsubscribed");
    } catch (error) {
      console.error("Error unsubscribing:", error);
      toast.error(error instanceof Error ? error.message : "Failed to unsubscribe");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[url(https://grainy-gradients.vercel.app/noise.svg)] bg-[conic-gradient(at_top,_var(--tw-gradient-stops))] from-gray-100 via-gray-200 to-gray-300">
      <div className="absolute inset-0 opacity-25 brightness-100 contrast-150" />
      <Card className="max-w-md z-10 w-full">
        <CardHeader>
          <CardTitle className="text-center">Unsubscribe</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="your-email@example.com" type="email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason for unsubscribing</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a reason" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="too_many_emails">Too many emails</SelectItem>
                        <SelectItem value="not_relevant">Content not relevant</SelectItem>
                        <SelectItem value="never_signed_up">I never signed up</SelectItem>
                        <SelectItem value="other">Other reason</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="comments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional comments (optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Please tell us how we could improve..."
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <CardFooter className="flex justify-center px-0 pt-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Processing..." : "Unsubscribe"}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}