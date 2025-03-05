import { cache } from "react";

import { TRPCError, initTRPC } from "@trpc/server";
import superjson from "superjson";

import { createClient } from "@/utils/supabase/server";

export const createTRPCContext = cache(async () => {
  /**
   * @see: https://trpc.io/docs/server/context
   */
  // Aqui tengo que desencriptar la session del usuario para poder acceder a su id y si está autenticado o no
  // Este contexto se ejecuta en todas las rutas y debe mantenerse lo más ligero posible, sin llamadas a la bbdd
  // const supabase = await createClient();
  // const { data } = await supabase.auth.getSession();
  // return { userId: data.session?.user?.id };
  return;
});

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;
// Avoid exporting the entire t-object
// since it's not very descriptive.
// For instance, the use of a t variable
// is common in i18n libraries.
// const t = initTRPC.context<Context>().create({
const t = initTRPC.context().create({
  /**
   * @see https://trpc.io/docs/server/data-transformers
   */
  transformer: superjson,
});
// Base router and procedure helpers
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(
  async function isAuthed(opts) {
    // const { ctx } = opts;

    // if (!ctx.userId) {
    //   throw new TRPCError({ code: "UNAUTHORIZED" });
    // }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();

    if (!data.user || error) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    // TODO - add rate limit here

    return opts.next({
      ctx: {
        // ...ctx,
        user: data.user,
      },
    });
  }
);
