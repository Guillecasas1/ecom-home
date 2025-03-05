"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { z } from "zod";

import { createClient } from "@/utils/supabase/server";

import { registerSchema } from "../ui/components/register-form";

export const register = async (values: z.infer<typeof registerSchema>) => {
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp(values);

  if (error) {
    redirect("/error");
  }

  revalidatePath("/", "layout");
  redirect("/auth/login");
};
