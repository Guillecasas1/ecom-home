"use server";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { z } from "zod";
import { registerSchema } from "../ui/components/register-form";

export const login = async (values: z.infer<typeof registerSchema>) => {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword(values)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/admin')
}
