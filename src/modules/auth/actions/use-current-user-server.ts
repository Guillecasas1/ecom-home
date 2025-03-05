"use server";

import { createClient } from "@/utils/supabase/server";

export const currentUser = async () => {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    return null;
  }

  return data.user;
};
