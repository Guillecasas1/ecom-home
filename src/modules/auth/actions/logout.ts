"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export const logout = async () => {
  const cookieStore = cookies();
  cookieStore.delete("USER_TOKEN");
  cookieStore.delete("user");

  revalidatePath("/", "layout");
};
